const express = require('express');
const { z } = require('zod');
const { prisma } = require('../utils/prisma');
const { success, ApiError } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');
const { validate } = require('../utils/validate');

const router = express.Router();

router.get('/me', authRequired, asyncHandler(async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, fullName: true, email: true, phone: true, role: true, isEmailVerified: true } });
  return success(res, me);
}));

const updateSchema = z.object({ fullName: z.string().min(2).optional(), phone: z.string().optional() });
router.put('/me', authRequired, validate(updateSchema), asyncHandler(async (req, res) => {
  const updated = await prisma.user.update({ where: { id: req.user.id }, data: req.body, select: { id: true, fullName: true, email: true, phone: true } });
  return success(res, updated, 'Profile updated');
}));

router.get('/', authRequired, allowRoles('ADMIN'), asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  return success(res, users);
}));

router.delete('/:id', authRequired, allowRoles('ADMIN'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.user.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  return success(res, null, 'User soft deleted');
}));

module.exports = router;
