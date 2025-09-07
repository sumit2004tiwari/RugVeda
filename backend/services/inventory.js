const { prisma } = require('../utils/prisma');

async function adjustStock({ productId, variantId = null, quantity, reason, action }) {
  if (!productId && !variantId) throw new Error('productId or variantId required');
  if (variantId) {
    await prisma.productVariant.update({ where: { id: variantId }, data: { stockQuantity: { increment: quantity } } });
    await prisma.inventoryTransaction.create({ data: { variantId, action, quantity, reason } });
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    const totalVarStock = await prisma.productVariant.aggregate({ _sum: { stockQuantity: true }, where: { productId: variant.productId } });
    await prisma.product.update({ where: { id: variant.productId }, data: { stockQuantity: totalVarStock._sum.stockQuantity || 0 } });
  } else {
    await prisma.product.update({ where: { id: productId }, data: { stockQuantity: { increment: quantity } } });
    await prisma.inventoryTransaction.create({ data: { productId, action, quantity, reason } });
  }
}

async function restoreForCancellation(items) {
  for (const item of items) {
    await adjustStock({ productId: item.productId, variantId: item.variantId, quantity: item.quantity, reason: 'Order cancelled', action: 'CANCEL_RESTORE' });
  }
}

module.exports = { adjustStock, restoreForCancellation };
