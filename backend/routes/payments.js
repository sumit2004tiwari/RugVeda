const express = require('express');
const { z } = require('zod');
const { prisma } = require('../utils/prisma');
const { success, ApiError } = require('../utils/response');
const { authRequired } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');
const { validate } = require('../utils/validate');

const router = express.Router();

const intentSchema = z.object({ orderId: z.string().uuid(), provider: z.enum(['RAZORPAY','STRIPE','COD']).default('RAZORPAY') });
router.post('/intent', authRequired, validate(intentSchema), asyncHandler(async (req, res) => {
  const { orderId, provider } = req.body;
  const order = await prisma.order.findFirst({ where: { id: orderId, userId: req.user.id } });
  if (!order) throw new ApiError(404, 'Order not found');
  const payment = await prisma.payment.create({ data: { orderId, provider, amount: order.totalAmount, currency: order.currency, status: provider === 'COD' ? 'SUCCEEDED' : 'INITIATED', providerOrderId: provider !== 'COD' ? `prov_${order.orderNumber}` : null } });
  if (provider === 'COD') await prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } });
  return success(res, payment, 'Payment intent created', 201);
}));

const webhookSchema = z.object({ provider: z.enum(['RAZORPAY','STRIPE']), providerOrderId: z.string(), event: z.enum(['payment_succeeded','payment_failed']) });
router.post('/webhook', validate(webhookSchema), asyncHandler(async (req, res) => {
  const { provider, providerOrderId, event } = req.body;
  const payment = await prisma.payment.findFirst({ where: { provider, providerOrderId } });
  if (!payment) return res.status(200).end();
  if (event === 'payment_succeeded') {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCEEDED', paidAt: new Date() } });
    await prisma.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } });
  } else if (event === 'payment_failed') {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
  }
  return success(res, { ok: true }, 'Webhook processed');
}));

const refundSchema = z.object({ paymentId: z.string().uuid(), amount: z.number().positive() });
router.post('/refund', authRequired, validate(refundSchema), asyncHandler(async (req, res) => {
  const { paymentId, amount } = req.body;
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
  if (!payment) throw new ApiError(404, 'Payment not found');
  const refund = await prisma.refund.create({ data: { paymentId, amount } });
  await prisma.payment.update({ where: { id: paymentId }, data: { status: 'REFUNDED' } });
  await prisma.order.update({ where: { id: payment.orderId }, data: { status: 'REFUNDED' } });
  return success(res, refund, 'Refund created', 201);
}));

module.exports = router;
