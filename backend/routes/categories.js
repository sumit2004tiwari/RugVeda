const express = require('express');
const { prisma } = require('../utils/prisma');
const { success } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await prisma.category.findMany({ where: { isActive: true }, orderBy: { position: 'asc' } });
    return success(res, items);
  } catch (e) { next(e); }
});

router.post('/', authRequired, allowRoles('ADMIN', 'VENDOR'), async (req, res, next) => {
  try {
    const { name, slug, parentId, position = 0 } = req.body;
    const item = await prisma.category.create({ data: { name, slug, parentId: parentId || null, position } });
    return success(res, item, 'Category created', 201);
  } catch (e) { next(e); }
});

module.exports = router;
