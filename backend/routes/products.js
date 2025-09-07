const express = require('express');
const { prisma } = require('../utils/prisma');
const { success, ApiError } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');

const router = express.Router();

// List with filters, search, sort, pagination
router.get('/', async (req, res, next) => {
  try {
    const { q, categoryId, material, color, origin, minPrice, maxPrice, inStock, sort = 'recent', page = '1', pageSize = '12' } = req.query;
    const where = { isActive: true, isDeleted: false };
    if (q) where.OR = [
      { name: { contains: String(q), mode: 'insensitive' } },
      { description: { contains: String(q), mode: 'insensitive' } },
    ];
    if (categoryId) where.categories = { some: { categoryId: String(categoryId) } };
    if (material) where.material = String(material);
    if (color) where.color = String(color);
    if (origin) where.origin = String(origin);
    if (inStock === 'true') where.stockQuantity = { gt: 0 };
    if (minPrice || maxPrice) where.price = { gte: minPrice ? Number(minPrice) : undefined, lte: maxPrice ? Number(maxPrice) : undefined };

    const orderBy = sort === 'price_asc' ? { price: 'asc' }
      : sort === 'price_desc' ? { price: 'desc' }
      : sort === 'name_asc' ? { name: 'asc' }
      : sort === 'name_desc' ? { name: 'desc' }
      : { createdAt: 'desc' };

    const skip = (parseInt(String(page)) - 1) * parseInt(String(pageSize));
    const take = parseInt(String(pageSize));

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          images: { orderBy: { position: 'asc' } },
          variants: true,
          categories: { include: { category: true } },
        },
      }),
    ]);

    return success(res, { total, page: Number(page), pageSize: Number(pageSize), items });
  } catch (e) { next(e); }
});

// Admin/vendor create product
router.post('/', authRequired, allowRoles('ADMIN', 'VENDOR'), async (req, res, next) => {
  try {
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
    return success(res, created, 'Product created', 201);
  } catch (e) { next(e); }
});

// Get product by slug
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const item = await prisma.product.findFirst({ where: { slug: String(req.params.slug), isDeleted: false }, include: { images: true, variants: true, categories: { include: { category: true } } } });
    if (!item) throw new ApiError(404, 'Product not found');
    return success(res, item);
  } catch (e) { next(e); }
});

// Update product
router.put('/:id', authRequired, allowRoles('ADMIN', 'VENDOR'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const updated = await prisma.product.update({ where: { id }, data });
    return success(res, updated, 'Product updated');
  } catch (e) { next(e); }
});

// Soft delete product
router.delete('/:id', authRequired, allowRoles('ADMIN', 'VENDOR'), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.product.update({ where: { id }, data: { isDeleted: true, isActive: false, deletedAt: new Date() } });
    return success(res, null, 'Product deleted');
  } catch (e) { next(e); }
});

module.exports = router;
