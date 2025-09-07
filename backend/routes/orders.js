const express = require('express');
const { prisma } = require('../utils/prisma');
const { success, ApiError } = require('../utils/response');
const { authRequired } = require('../middlewares/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

function genOrderNumber() { return 'ORD-' + uuidv4().slice(0, 8).toUpperCase(); }

async function recalcStock(productId, variantId, qtyDelta) {
  if (variantId) {
    const v = await prisma.productVariant.update({ where: { id: variantId }, data: { stockQuantity: { increment: -qtyDelta } } });
    await prisma.inventoryTransaction.create({ data: { variantId, action: 'SALE', quantity: -qtyDelta, reason: 'Order placed' } });
    const totalVarStock = await prisma.productVariant.aggregate({ _sum: { stockQuantity: true }, where: { productId } });
    await prisma.product.update({ where: { id: productId }, data: { stockQuantity: totalVarStock._sum.stockQuantity || 0 } });
  } else {
    await prisma.product.update({ where: { id: productId }, data: { stockQuantity: { increment: -qtyDelta } } });
    await prisma.inventoryTransaction.create({ data: { productId, action: 'SALE', quantity: -qtyDelta, reason: 'Order placed' } });
  }
}

router.post('/', authRequired, async (req, res, next) => {
  try {
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
        const variant = item.variantId ? variants.find(v => v.id === item.variantId) : null;
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
        await recalcStock(item.productId, item.variantId, item.quantity);
      }

      if (coupon) {
        await tx.couponRedemption.create({ data: { couponId: coupon.id, userId: req.user.id, orderId: created.id } });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    // Create payment record
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

    return success(res, { orderId: order.id, orderNumber: order.orderNumber, payment }, 'Order placed', 201);
  } catch (e) { next(e); }
});

router.get('/', authRequired, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({ where: { userId: req.user.id }, orderBy: { placedAt: 'desc' }, include: { items: { include: { product: true, variant: true } }, payments: true } });
    return success(res, orders);
  } catch (e) { next(e); }
});

module.exports = router;
