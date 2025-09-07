const express = require('express');
const { z } = require('zod');
const { prisma } = require('../utils/prisma');
const { success } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');
const { validate } = require('../utils/validate');

const router = express.Router();

const upsertSchema = z.object({ productId: z.string().uuid(), variantId: z.string().uuid().nullable().optional(), url: z.string().url(), alt: z.string().nullable().optional(), position: z.number().int().min(0).optional() });
router.post('/', authRequired, allowRoles('ADMIN','VENDOR'), validate(upsertSchema), asyncHandler(async (req, res) => {
  const img = await prisma.productImage.create({ data: { ...req.body, variantId: req.body.variantId || null } });
  return success(res, img, 'Image added', 201);
}));

router.put('/:id', authRequired, allowRoles('ADMIN','VENDOR'), validate(upsertSchema.partial()), asyncHandler(async (req, res) => {
  const img = await prisma.productImage.update({ where: { id: req.params.id }, data: req.body });
  return success(res, img, 'Image updated');
}));

router.delete('/:id', authRequired, allowRoles('ADMIN','VENDOR'), asyncHandler(async (req, res) => {
  await prisma.productImage.delete({ where: { id: req.params.id } });
  return success(res, null, 'Image deleted');
}));

module.exports = router;
