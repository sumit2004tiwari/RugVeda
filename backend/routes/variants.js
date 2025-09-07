const express = require('express');
const { z } = require('zod');
const { prisma } = require('../utils/prisma');
const { success, ApiError } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');
const { validate } = require('../utils/validate');

const router = express.Router();

const createSchema = z.object({ productId: z.string().uuid(), sku: z.string().optional(), variantName: z.string().optional(), additionalPrice: z.number().nonnegative().optional(), stockQuantity: z.number().int().nonnegative().optional(), lengthCm: z.number().optional(), widthCm: z.number().optional(), metadata: z.any().optional() });
router.post('/', authRequired, allowRoles('ADMIN','VENDOR'), validate(createSchema), asyncHandler(async (req, res) => {
  const v = await prisma.productVariant.create({ data: { ...req.body } });
  return success(res, v, 'Variant created', 201);
}));

router.put('/:id', authRequired, allowRoles('ADMIN','VENDOR'), validate(createSchema.partial()), asyncHandler(async (req, res) => {
  const v = await prisma.productVariant.update({ where: { id: req.params.id }, data: req.body });
  return success(res, v, 'Variant updated');
}));

router.delete('/:id', authRequired, allowRoles('ADMIN','VENDOR'), asyncHandler(async (req, res) => {
  await prisma.productVariant.delete({ where: { id: req.params.id } });
  return success(res, null, 'Variant deleted');
}));

module.exports = router;
