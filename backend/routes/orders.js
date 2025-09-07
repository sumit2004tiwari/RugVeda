const express = require('express');
const { prisma } = require('../utils/prisma');
const { success, ApiError } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler } = require('../utils/async');
const { restoreForCancellation } = require('../services/inventory');
const { recordAudit } = require('../services/audit');

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
  const { shippingAddressId, billingAddressId, couponCode, paymentMethod = 'COD' } = req.body;
  const cart = await prisma.cart.findUnique({ where: { userId: req.user.id }, include: { items: true } });
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Cart is empty');

  const products = await prisma.product.findMany({ where: { id: { in: cart.items.map(i => i.productId) } } });
  const variants = await prisma.productVariant.findMany({ where: { id: { in: cart.items.filter(i=>i.variantId).map(i => i.variantId) } } });

  let subtotal = 0;
  for (const item of cart.items) subtotal += Number(item.unitPrice) * item.quantity;

  let coupon = null; let discountAmount = 0;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon) throw new ApiError(400, 'Invalid coupon');
    if (subtotal < Number(coupon.minOrderAmount)) throw new ApiError(400, 'Minimum order not met');
    if (!coupon.isActive) throw new ApiError(400, 'Coupon inactive');
    const usedByUser = await prisma.couponRedemption.count({ where: { couponId: coupon.id, userId: req.user.id } });
    if (usedByUser >= coupon.perUserLimit) throw new ApiError(400, 'Coupon already used');
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (Number(coupon.discountValue) / 100) * subtotal;
      if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
    } else {
      discountAmount = Math.min(Number(coupon.discountValue), subtotal);
    }
  }

  const shippingAmount = 0; // extend later
  const taxAmount = 0; // extend later
  const totalAmount = subtotal + shippingAmount + taxAmount - discountAmount;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: req.user.id,
        orderNumber: genOrderNumber(),
        status: 'PENDING',
        shippingAddressId: shippingAddressId || null,
        billingAddressId: billingAddressId || null,
        subtotal, shippingAmount, discountAmount, taxAmount, totalAmount,
        currency: 'INR',
        couponId: coupon ? coupon.id : null,
      },
    });

    for (const item of cart.items) {
      const product = products.find(p => p.id === item.productId);
      await tx.orderItem.create({ data: {
        orderId: created.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: product.gstRate ? Number(product.gstRate) : null,
        taxAmount: null,
        discount: null,
        totalPrice: Number(item.unitPrice) * item.quantity,
      }});
      await decStockOnCreate(item.productId, item.variantId, item.quantity);
    }

    if (coupon) {
      await tx.couponRedemption.create({ data: { couponId: coupon.id, userId: req.user.id, orderId: created.id } });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  const payment = await prisma.payment.create({ data: {
    orderId: order.id,
    provider: paymentMethod === 'COD' ? 'COD' : 'RAZORPAY',
    amount: totalAmount,
    currency: 'INR',
    status: paymentMethod === 'COD' ? 'SUCCEEDED' : 'INITIATED',
  }});

  if (paymentMethod === 'COD') {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'CONFIRMED' } });
  }

  await recordAudit('Order', order.id, 'CREATE', req.user.id, { totalAmount });
  return success(res, { orderId: order.id, orderNumber: order.orderNumber, payment }, 'Order placed', 201);
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
