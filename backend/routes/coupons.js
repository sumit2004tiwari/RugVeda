const express = require('express');
const dayjs = require('dayjs');
const { prisma } = require('../utils/prisma');
const { success, ApiError } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');
const { z } = require('zod');
const { asyncHandler } = require('../utils/async');
const { validate } = require('../utils/validate');

const router = express.Router();

async function computeDiscount(coupon, subtotal) {
  if (coupon.discountType === 'PERCENTAGE') {
    const disc = (Number(coupon.discountValue) / 100) * subtotal;
    return coupon.maxDiscountAmount ? Math.min(disc, Number(coupon.maxDiscountAmount)) : disc;
  }
  return Math.min(Number(coupon.discountValue), subtotal);
}

router.get('/validate', authRequired, async (req, res, next) => {
  try {
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
    const discount = await computeDiscount(coupon, sub);
    return success(res, { coupon, discount });
  } catch (e) { next(e); }
});

module.exports = router;
