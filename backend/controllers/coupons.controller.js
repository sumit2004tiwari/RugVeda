const dayjs = require('dayjs');
const { prisma } = require('../utils/prisma');
const { ApiError } = require('../utils/response');

function computeDiscount(coupon, subtotal) {
  if (coupon.discountType === 'PERCENTAGE') {
    const disc = (Number(coupon.discountValue) / 100) * subtotal;
    return coupon.maxDiscountAmount ? Math.min(disc, Number(coupon.maxDiscountAmount)) : disc;
  }
  return Math.min(Number(coupon.discountValue), subtotal);
}

async function list(_req) {
  const items = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  return items;
}

async function create(req) {
  const data = { ...req.body, startsAt: req.body.startsAt ? new Date(req.body.startsAt) : null, endsAt: req.body.endsAt ? new Date(req.body.endsAt) : null };
  const c = await prisma.coupon.create({ data });
  return c;
}

async function update(req) {
  const data = { ...req.body };
  if (data.startsAt) data.startsAt = new Date(data.startsAt);
  if (data.endsAt) data.endsAt = new Date(data.endsAt);
  const c = await prisma.coupon.update({ where: { id: req.params.id }, data });
  return c;
}

async function deactivate(req) {
  await prisma.coupon.update({ where: { id: req.params.id }, data: { isActive: false } });
  return { ok: true };
}

async function validateCoupon(req) {
  const { code, subtotal } = req.query;
  if (!code) throw new ApiError(400, 'code required');
  const coupon = await prisma.coupon.findUnique({ where: { code: String(code) }, include: { redemptions: true } });
  if (!coupon || !coupon.isActive) throw new ApiError(404, 'Invalid coupon');
  const now = dayjs();
  if (coupon.startsAt && now.isBefore(dayjs(coupon.startsAt))) throw new ApiError(400, 'Coupon not started');
  if (coupon.endsAt && now.isAfter(dayjs(coupon.endsAt))) throw new ApiError(400, 'Coupon expired');
  const usedCount = await prisma.couponRedemption.count({ where: { couponId: coupon.id } });
  if (coupon.usageLimit && usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon usage limit reached');
  const userUsed = await prisma.couponRedemption.count({ where: { couponId: coupon.id, userId: req.user.id } });
  if (userUsed >= coupon.perUserLimit) throw new ApiError(400, 'Coupon already used');
  if (coupon.isFirstOrderOnly) {
    const orders = await prisma.order.count({ where: { userId: req.user.id } });
    if (orders > 0) throw new ApiError(400, 'First order only');
  }
  const sub = Number(subtotal || 0);
  if (sub < Number(coupon.minOrderAmount)) throw new ApiError(400, 'Minimum order amount not met');
  const discount = computeDiscount(coupon, sub);
  return { coupon, discount };
}

async function redemptions(req) {
  const list = await prisma.couponRedemption.findMany({ where: { couponId: req.params.id }, orderBy: { redeemedAt: 'desc' } });
  return list;
}

module.exports = { list, create, update, deactivate, validateCoupon, redemptions };
