const express = require('express');
const { z } = require('zod');
const { prisma } = require('../utils/prisma');
const { success } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');
const { validate } = require('../utils/validate');

const router = express.Router();

router.get('/', asyncHandler(async (_req, res) => {
  const vendor = await prisma.vendor.findFirst({ where: { isActive: true } });
  return success(res, vendor);
}));

const vendorSchema = z.object({ name: z.string().min(2), email: z.string().email().nullable().optional(), phone: z.string().nullable().optional(), config: z.any().optional(), isActive: z.boolean().optional() });
router.put('/', authRequired, allowRoles('ADMIN'), validate(vendorSchema.partial()), asyncHandler(async (req, res) => {
  const exists = await prisma.vendor.findFirst();
  const updated = exists
    ? await prisma.vendor.update({ where: { id: exists.id }, data: req.body })
    : await prisma.vendor.create({ data: { name: req.body.name || 'Store', email: req.body.email || null, phone: req.body.phone || null, config: req.body.config || {} } });
  return success(res, updated, 'Vendor saved');
}));

module.exports = router;
