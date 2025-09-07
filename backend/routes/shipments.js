const express = require('express');
const { z } = require('zod');
const { prisma } = require('../utils/prisma');
const { success, ApiError } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');
const { validate } = require('../utils/validate');

const router = express.Router();

const createSchema = z.object({ orderId: z.string().uuid(), carrier: z.string().optional(), service: z.string().optional(), trackingNumber: z.string().optional(), eta: z.string().datetime().optional() });
router.post('/', authRequired, allowRoles('ADMIN','VENDOR'), validate(createSchema), asyncHandler(async (req, res) => {
  const shipment = await prisma.shipment.create({ data: { ...req.body, eta: req.body.eta ? new Date(req.body.eta) : null } });
  return success(res, shipment, 'Shipment created', 201);
}));

const statusSchema = z.object({ status: z.enum(['CREATED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED','RETURN_TO_ORIGIN','CANCELLED']) });
router.put('/:id/status', authRequired, allowRoles('ADMIN','VENDOR'), validate(statusSchema), asyncHandler(async (req, res) => {
  const { id } = req.params; const { status } = req.body;
  const sh = await prisma.shipment.update({ where: { id }, data: { status, deliveredAt: status==='DELIVERED'? new Date(): null } });
  return success(res, sh, 'Shipment status updated');
}));

router.get('/order/:orderId', authRequired, asyncHandler(async (req, res) => {
  const list = await prisma.shipment.findMany({ where: { orderId: req.params.orderId }, orderBy: { createdAt: 'asc' } });
  return success(res, list);
}));

module.exports = router;
