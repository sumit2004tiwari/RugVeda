const express = require('express');
const { prisma } = require('../utils/prisma');
const { success, ApiError } = require('../utils/response');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authRequired, async (req, res, next) => {
  try {
    const items = await prisma.address.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
    return success(res, items);
  } catch (e) { next(e); }
});

router.post('/', authRequired, async (req, res, next) => {
  try {
    const data = req.body;
    const created = await prisma.address.create({ data: { ...data, userId: req.user.id } });
    if (created.isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user.id, id: { not: created.id } }, data: { isDefault: false } });
    }
    return success(res, created, 'Address created', 201);
  } catch (e) { next(e); }
});

router.put('/:id', authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const item = await prisma.address.update({ where: { id }, data });
    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user.id, id: { not: id } }, data: { isDefault: false } });
    }
    return success(res, item, 'Address updated');
  } catch (e) { next(e); }
});

router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.address.delete({ where: { id } });
    return success(res, null, 'Address deleted');
  } catch (e) { next(e); }
});

module.exports = router;
