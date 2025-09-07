const express = require('express');
const { prisma } = require('../utils/prisma');
const { success, ApiError } = require('../utils/response');
const { authRequired } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');

const router = express.Router();

async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });
  return cart;
}

router.get('/', authRequired, asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  const full = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: { include: { product: { include: { images: true } }, variant: true } } } });
  return success(res, full);
}));

router.post('/items', authRequired, asyncHandler(async (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body;
  if (!productId) throw new ApiError(400, 'productId required');
  const cart = await getOrCreateCart(req.user.id);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, 'Product not found');
  let variant = null;
  if (variantId) {
    variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant || variant.productId !== productId) throw new ApiError(400, 'Invalid variant');
  }
  const unitPrice = Number(product.price) + Number(variant?.additionalPrice || 0);
  const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId, variantId: variantId || null } });
  const item = existing
    ? await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + Number(quantity) } })
    : await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId: variantId || null, quantity: Number(quantity), unitPrice } });
  return success(res, item, 'Item added', 201);
}));

router.put('/items/:id', authRequired, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  if (quantity < 1) throw new ApiError(400, 'Quantity must be >= 1');
  const item = await prisma.cartItem.update({ where: { id }, data: { quantity: Number(quantity) } });
  return success(res, item, 'Item updated');
}));

router.delete('/items/:id', authRequired, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.cartItem.delete({ where: { id } });
  return success(res, null, 'Item removed');
}));

module.exports = router;
