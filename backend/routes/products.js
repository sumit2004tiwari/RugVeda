const express = require('express');
const { success } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');
const ctrl = require('../controllers/products.controller');

const router = express.Router();

// List with filters, search, sort, pagination
router.get('/', asyncHandler(async (req, res) => {
  const data = await ctrl.list(req);
  return success(res, data);
}));

// Admin/vendor create product
router.post('/', authRequired, allowRoles('ADMIN', 'VENDOR'), asyncHandler(async (req, res) => {
  const { name, slug, description, price, currency, metadata, images = [], categories = [], variants = [] } = req.body;
  if (!name || !slug || typeof price === 'undefined') throw new ApiError(400, 'Missing required fields');
  const created = await prisma.product.create({
    data: {
      name, slug, description: description || null, price: new prisma.Prisma.Decimal(price), currency: currency || 'INR', metadata: metadata || {},
      images: { create: images.map((i, idx) => ({ url: i.url, alt: i.alt || null, position: typeof i.position === 'number' ? i.position : idx })) },
      categories: { create: categories.map((cid) => ({ categoryId: cid })) },
      variants: { create: variants.map((v) => ({ variantName: v.variantName || null, sku: v.sku || null, additionalPrice: new prisma.Prisma.Decimal(v.additionalPrice || 0), stockQuantity: v.stockQuantity || 0, lengthCm: v.lengthCm ? new prisma.Prisma.Decimal(v.lengthCm) : null, widthCm: v.widthCm ? new prisma.Prisma.Decimal(v.widthCm) : null, metadata: v.metadata || {} })) },
    },
    include: { images: true, variants: true, categories: true },
  });
  await recordAudit('Product', created.id, 'CREATE', req.user?.id, { name: created.name, price: created.price });
  return success(res, created, 'Product created', 201);
}));

// Get product by slug
router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const item = await prisma.product.findFirst({ where: { slug: String(req.params.slug), isDeleted: false }, include: { images: true, variants: true, categories: { include: { category: true } } } });
  if (!item) throw new ApiError(404, 'Product not found');
  return success(res, item);
}));

// Update product
router.put('/:id', authRequired, allowRoles('ADMIN', 'VENDOR'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body || {};
  const updated = await prisma.product.update({ where: { id }, data });
  await recordAudit('Product', id, 'UPDATE', req.user?.id, data);
  return success(res, updated, 'Product updated');
}));

// Soft delete product
router.delete('/:id', authRequired, allowRoles('ADMIN', 'VENDOR'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.product.update({ where: { id }, data: { isDeleted: true, isActive: false, deletedAt: new Date() } });
  await recordAudit('Product', id, 'DELETE', req.user?.id);
  return success(res, null, 'Product deleted');
}));

module.exports = router;
