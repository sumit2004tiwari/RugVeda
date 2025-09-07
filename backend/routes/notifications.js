const express = require('express');
const { prisma } = require('../utils/prisma');
const { success } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authRequired, async (req, res, next) => {
  try {
    const items = await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
    return success(res, items);
  } catch (e) { next(e); }
});

router.post('/read/:id', authRequired, async (req, res, next) => {
  try {
    const { id } = req.params;
    const n = await prisma.notification.update({ where: { id }, data: { isRead: true } });
    return success(res, n, 'Marked read');
  } catch (e) { next(e); }
});

router.post('/read-all', authRequired, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
    return success(res, { ok: true }, 'All marked read');
  } catch (e) { next(e); }
});

router.post('/:id/vendor-read', authRequired, allowRoles('ADMIN','VENDOR'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const n = await prisma.notification.update({ where: { id }, data: { vendorRead: true } });
    return success(res, n, 'Vendor marked read');
  } catch (e) { next(e); }
});

module.exports = router;
