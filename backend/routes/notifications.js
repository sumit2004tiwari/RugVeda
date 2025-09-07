const express = require('express');
const { prisma } = require('../utils/prisma');
const { success } = require('../utils/response');
const { authRequired } = require('../middlewares/auth');

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

module.exports = router;
