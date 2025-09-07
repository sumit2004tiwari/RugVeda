const express = require('express');
const { prisma } = require('../utils/prisma');
const { success } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');

const router = express.Router();

router.get('/', authRequired, allowRoles('ADMIN','VENDOR'), asyncHandler(async (req, res) => {
  const { productId, variantId } = req.query;
  const where = {};
  if (productId) where.productId = String(productId);
  if (variantId) where.variantId = String(variantId);
  const items = await prisma.inventoryTransaction.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
  return success(res, items);
}));

module.exports = router;
