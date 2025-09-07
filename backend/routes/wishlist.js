const express = require('express');
const { prisma } = require('../utils/prisma');
const { success } = require('../utils/response');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authRequired, async (req, res, next) => {
  try {
    const items = await prisma.wishlist.findMany({ where: { userId: req.user.id }, include: { product: { include: { images: true } } } });
    return success(res, items);
  } catch (e) { next(e); }
});

router.post('/', authRequired, async (req, res, next) => {
  try {
    const { productId } = req.body;
    const item = await prisma.wishlist.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: {},
      create: { userId: req.user.id, productId },
    });
    return success(res, item, 'Added to wishlist', 201);
  } catch (e) { next(e); }
});

router.delete('/:productId', authRequired, async (req, res, next) => {
  try {
    const { productId } = req.params;
    await prisma.wishlist.delete({ where: { userId_productId: { userId: req.user.id, productId } } });
    return success(res, null, 'Removed from wishlist');
  } catch (e) { next(e); }
});

module.exports = router;
