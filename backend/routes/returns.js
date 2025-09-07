const express = require('express');
const { z } = require('zod');
const { prisma } = require('../utils/prisma');
const { success, ApiError } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');
const { validate } = require('../utils/validate');
const { adjustStock } = require('../services/inventory');

const router = express.Router();

const requestSchema = z.object({ orderId: z.string().uuid(), reason: z.string().optional(), items: z.array(z.object({ orderItemId: z.string().uuid(), quantity: z.number().int().positive() })).min(1) });
router.post('/', authRequired, validate(requestSchema), asyncHandler(async (req, res) => {
  const { orderId, reason, items } = req.body;
  const order = await prisma.order.findFirst({ where: { id: orderId, userId: req.user.id }, include: { items: true } });
  if (!order) throw new ApiError(404, 'Order not found');
  const rr = await prisma.$transaction(async (tx) => {
    const created = await tx.returnRequest.create({ data: { orderId, reason: reason || null, status: 'RETURN_REQUESTED' } });
    for (const it of items) {
      const oi = order.items.find(x => x.id === it.orderItemId);
      if (!oi || it.quantity > oi.quantity) throw new ApiError(400, 'Invalid return quantity');
      await tx.returnItem.create({ data: { returnId: created.id, orderItemId: it.orderItemId, quantity: it.quantity, refundAmount: null } });
    }
    return created;
  });
  return success(res, rr, 'Return requested', 201);
}));

const decideSchema = z.object({ status: z.enum(['RETURN_APPROVED','RETURN_REJECTED','RETURNED']), refunds: z.array(z.object({ returnItemId: z.string().uuid(), refundAmount: z.number().nonnegative().optional() })).optional() });
router.put('/:id/decision', authRequired, allowRoles('ADMIN','VENDOR'), validate(decideSchema), asyncHandler(async (req, res) => {
  const { id } = req.params; const { status, refunds = [] } = req.body;
  const ret = await prisma.returnRequest.update({ where: { id }, data: { status, approvedAt: status==='RETURN_APPROVED'? new Date(): undefined, resolvedAt: status==='RETURN_REJECTED'||status==='RETURNED'? new Date(): undefined } });
  if (status === 'RETURNED') {
    const items = await prisma.returnItem.findMany({ where: { returnId: id }, include: { orderItem: true } });
    for (const it of items) {
      await adjustStock({ productId: it.orderItem.productId, variantId: it.orderItem.variantId, quantity: it.quantity, reason: 'Return received', action: 'RETURN_IN' });
    }
  }
  return success(res, ret, 'Return updated');
}));

module.exports = router;
