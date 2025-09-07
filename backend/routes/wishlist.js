const express = require('express');
const { prisma } = require('../utils/prisma');
const { success } = require('../utils/response');
const { authRequired } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');

const router = express.Router();

router.get('/', authRequired, asyncHandler(async (req, res) => {
  const items = await prisma.wishlist.findMany({ where: { userId: req.user.id }, include: { product: { include: { images: true } } } });
  return success(res, items);
}));

router.post('/', authRequired, asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const item = await prisma.wishlist.upsert({
    where: { userId_productId: { userId: req.user.id, productId } },
    update: {},
    create: { userId: req.user.id, productId },
  });
  return success(res, item, 'Added to wishlist', 201);
}));

router.delete('/:productId', authRequired, asyncHandler(async (req, res) => {
  const { productId } = req.params;
  await prisma.wishlist.delete({ where: { userId_productId: { userId: req.user.id, productId } } });
  return success(res, null, 'Removed from wishlist');
}));

module.exports = router;
