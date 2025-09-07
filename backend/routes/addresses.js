const express = require('express');
const { prisma } = require('../utils/prisma');
const { success } = require('../utils/response');
const { authRequired } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');

const router = express.Router();

router.get('/', authRequired, asyncHandler(async (req, res) => {
  const items = await prisma.address.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
  return success(res, items);
}));

router.post('/', authRequired, asyncHandler(async (req, res) => {
  const data = req.body;
  const created = await prisma.address.create({ data: { ...data, userId: req.user.id } });
  if (created.isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.id, id: { not: created.id } }, data: { isDefault: false } });
  }
  return success(res, created, 'Address created', 201);
}));

router.put('/:id', authRequired, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const item = await prisma.address.update({ where: { id }, data });
  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.id, id: { not: id } }, data: { isDefault: false } });
  }
  return success(res, item, 'Address updated');
}));

router.delete('/:id', authRequired, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.address.delete({ where: { id } });
  return success(res, null, 'Address deleted');
}));

module.exports = router;
