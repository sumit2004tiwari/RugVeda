const { prisma } = require('../utils/prisma');
const { ApiError } = require('../utils/response');

async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });
  return cart;
}

async function getCart(req) {
  const cart = await getOrCreateCart(req.user.id);
  const full = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: { include: { product: { include: { images: true } }, variant: true } } } });
  return full;
}

async function addItem(req) {
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
  return item;
}

async function updateItem(req) {
  const { id } = req.params; const { quantity } = req.body;
  if (quantity < 1) throw new ApiError(400, 'Quantity must be >= 1');
  const item = await prisma.cartItem.update({ where: { id }, data: { quantity: Number(quantity) } });
  return item;
}

async function removeItem(req) {
  const { id } = req.params; await prisma.cartItem.delete({ where: { id } });
  return { ok: true };
}

module.exports = { getCart, addItem, updateItem, removeItem };
