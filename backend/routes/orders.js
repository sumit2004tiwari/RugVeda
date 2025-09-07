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
  const data = await ctrl.listMyOrders(req);
  return success(res, data);
}));

router.put('/:id/status', authRequired, allowRoles('ADMIN','VENDOR'), asyncHandler(async (req, res) => {
  const data = await ctrl.updateStatus(req);
  return success(res, data, 'Status updated');
}));

module.exports = router;
