const express = require('express');
const { success } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');
const ctrl = require('../controllers/orders.controller');

const router = express.Router();

function genOrderNumber() { return 'ORD-' + uuidv4().slice(0, 8).toUpperCase(); }

async function decStockOnCreate(productId, variantId, qty) {
  if (variantId) {
    await prisma.productVariant.update({ where: { id: variantId }, data: { stockQuantity: { increment: -qty } } });
    await prisma.inventoryTransaction.create({ data: { variantId, action: 'SALE', quantity: -qty, reason: 'Order placed' } });
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    const totalVarStock = await prisma.productVariant.aggregate({ _sum: { stockQuantity: true }, where: { productId: variant.productId } });
    await prisma.product.update({ where: { id: variant.productId }, data: { stockQuantity: totalVarStock._sum.stockQuantity || 0 } });
  } else {
    await prisma.product.update({ where: { id: productId }, data: { stockQuantity: { increment: -qty } } });
    await prisma.inventoryTransaction.create({ data: { productId, action: 'SALE', quantity: -qty, reason: 'Order placed' } });
  }
}

router.post('/', authRequired, asyncHandler(async (req, res) => {
  const data = await ctrl.createOrder(req);
  return success(res, data, 'Order placed', 201);
}));

router.get('/', authRequired, asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({ where: { userId: req.user.id }, orderBy: { placedAt: 'desc' }, include: { items: { include: { product: true, variant: true } }, payments: true } });
  return success(res, orders);
}));

router.put('/:id/status', authRequired, allowRoles('ADMIN','VENDOR'), asyncHandler(async (req, res) => {
  const { id } = req.params; const { status } = req.body;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw new ApiError(404, 'Order not found');
  const allowed = new Set(['PENDING','PAID','CONFIRMED','PACKED','SHIPPED','DELIVERED','CANCELLED']);
  if (!allowed.has(status)) throw new ApiError(400, 'Invalid status');
  await prisma.order.update({ where: { id }, data: { status } });
  if (status === 'CANCELLED') await restoreForCancellation(order.items);
  await recordAudit('Order', id, 'STATUS_UPDATE', req.user?.id, { status });
  return success(res, { id, status }, 'Status updated');
}));

module.exports = router;
