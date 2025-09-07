const express = require('express');
const authRoutes = require('./auth');
const productRoutes = require('./products');
const categoryRoutes = require('./categories');
const cartRoutes = require('./cart');
const wishlistRoutes = require('./wishlist');
const addressRoutes = require('./addresses');
const couponRoutes = require('./coupons');
const orderRoutes = require('./orders');
const notificationRoutes = require('./notifications');
const chatRoutes = require('./chat');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/addresses', addressRoutes);
router.use('/coupons', couponRoutes);
router.use('/orders', orderRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chat', chatRoutes);

module.exports = router;
