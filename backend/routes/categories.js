const express = require('express');
const { z } = require('zod');
const { prisma } = require('../utils/prisma');
const { success } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');
const { validate } = require('../utils/validate');

const router = express.Router();

router.get('/', asyncHandler(async (_req, res) => {
  const items = await prisma.category.findMany({ where: { isActive: true }, orderBy: { position: 'asc' } });
  return success(res, items);
}));

const upsertSchema = z.object({ name: z.string().min(1), slug: z.string().min(1), parentId: z.string().uuid().nullable().optional(), position: z.number().int().min(0).optional() });
router.post('/', authRequired, allowRoles('ADMIN', 'VENDOR'), validate(upsertSchema), asyncHandler(async (req, res) => {
  const { name, slug, parentId, position = 0 } = req.body;
  const item = await prisma.category.create({ data: { name, slug, parentId: parentId || null, position } });
  return success(res, item, 'Category created', 201);
}));

router.put('/:id', authRequired, allowRoles('ADMIN', 'VENDOR'), validate(upsertSchema.partial()), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await prisma.category.update({ where: { id }, data: req.body });
  return success(res, item, 'Category updated');
}));

router.delete('/:id', authRequired, allowRoles('ADMIN', 'VENDOR'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.category.delete({ where: { id } });
  return success(res, null, 'Category deleted');
}));

const assignSchema = z.object({ productIds: z.array(z.string().uuid()).min(1) });
router.post('/:id/assign-products', authRequired, allowRoles('ADMIN', 'VENDOR'), validate(assignSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { productIds } = req.body;
  await prisma.productCategory.createMany({ data: productIds.map(pid => ({ productId: pid, categoryId: id })), skipDuplicates: true });
  return success(res, { categoryId: id, productIds }, 'Products assigned');
}));

router.post('/:id/unassign-products', authRequired, allowRoles('ADMIN', 'VENDOR'), validate(assignSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { productIds } = req.body;
  await prisma.productCategory.deleteMany({ where: { categoryId: id, productId: { in: productIds } } });
  return success(res, { categoryId: id, productIds }, 'Products unassigned');
}));

module.exports = router;
