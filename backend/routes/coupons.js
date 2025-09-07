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
  const data = await ctrl.validateCoupon(req);
  return success(res, data);
}));

router.get('/:id/redemptions', authRequired, allowRoles('ADMIN'), asyncHandler(async (req, res) => {
  const data = await ctrl.redemptions(req);
  return success(res, data);
}));

module.exports = router;
