const express = require('express');
const { success } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');
const { z } = require('zod');
const { asyncHandler } = require('../utils/async');
const { validate } = require('../utils/validate');
const ctrl = require('../controllers/coupons.controller');

const router = express.Router();

async function computeDiscount(coupon, subtotal) {
  if (coupon.discountType === 'PERCENTAGE') {
    const disc = (Number(coupon.discountValue) / 100) * subtotal;
    return coupon.maxDiscountAmount ? Math.min(disc, Number(coupon.maxDiscountAmount)) : disc;
  }
  return Math.min(Number(coupon.discountValue), subtotal);
}

router.get('/', authRequired, allowRoles('ADMIN'), asyncHandler(async (req, res) => {
  const data = await ctrl.list(req);
  return success(res, data);
}));

const upsertSchema = z.object({ code: z.string().min(2), description: z.string().optional(), discountType: z.enum(['PERCENTAGE','FIXED']), discountValue: z.number().positive(), maxDiscountAmount: z.number().nonnegative().nullable().optional(), minOrderAmount: z.number().nonnegative().optional(), startsAt: z.string().datetime().nullable().optional(), endsAt: z.string().datetime().nullable().optional(), usageLimit: z.number().int().positive().nullable().optional(), perUserLimit: z.number().int().positive().optional(), isFirstOrderOnly: z.boolean().optional(), isActive: z.boolean().optional() });
router.post('/', authRequired, allowRoles('ADMIN'), validate(upsertSchema), asyncHandler(async (req, res) => {
  const c = await ctrl.create(req);
  return success(res, c, 'Coupon created', 201);
}));

router.put('/:id', authRequired, allowRoles('ADMIN'), validate(upsertSchema.partial()), asyncHandler(async (req, res) => {
  const c = await ctrl.update(req);
  return success(res, c, 'Coupon updated');
}));

router.delete('/:id', authRequired, allowRoles('ADMIN'), asyncHandler(async (req, res) => {
  await ctrl.deactivate(req);
  return success(res, null, 'Coupon deactivated');
}));

router.get('/validate', authRequired, asyncHandler(async (req, res) => {
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
}));

router.get('/:id/redemptions', authRequired, allowRoles('ADMIN'), asyncHandler(async (req, res) => {
  const list = await prisma.couponRedemption.findMany({ where: { couponId: req.params.id }, orderBy: { redeemedAt: 'desc' } });
  return success(res, list);
}));

module.exports = router;
