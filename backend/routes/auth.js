const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { prisma } = require('../utils/prisma');
const { success, ApiError } = require('../utils/response');
const { signToken } = require('../utils/jwt');
const { asyncHandler } = require('../utils/async');
const { recordAudit } = require('../services/audit');

const router = express.Router();

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

router.post('/register', asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw new ApiError(409, 'Email already registered');
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { fullName: input.fullName, email: input.email, passwordHash, phone: input.phone || null },
  });
  await prisma.cart.create({ data: { userId: user.id } });
  await recordAudit('User', user.id, 'REGISTER', user.id, { email: user.email });
  const token = signToken({ id: user.id, role: user.role });
  return success(res, { token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } }, 'Registered', 201);
}));

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) throw new ApiError(401, 'Invalid credentials');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new ApiError(401, 'Invalid credentials');
  await recordAudit('User', user.id, 'LOGIN', user.id, { email: user.email });
  const token = signToken({ id: user.id, role: user.role });
  return success(res, { token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } }, 'Logged in');
}));

// Social provider login/link
const providerLoginSchema = z.object({ provider: z.string().min(2), providerUserId: z.string().min(1), email: z.string().email().optional(), fullName: z.string().optional() });
router.post('/provider/login', asyncHandler(async (req, res) => {
  const { provider, providerUserId, email, fullName } = providerLoginSchema.parse(req.body);
  const existing = await prisma.authProvider.findUnique({ where: { provider_providerUserId: { provider, providerUserId } } });
  if (existing) {
    const user = await prisma.user.findUnique({ where: { id: existing.userId } });
    const token = signToken({ id: user.id, role: user.role });
    return success(res, { token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } }, 'Logged in');
  }
  if (!email) throw new ApiError(400, 'Email required to create account');
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email, fullName: fullName || email.split('@')[0], passwordHash: null } });
    await prisma.cart.create({ data: { userId: user.id } });
  }
  await prisma.authProvider.create({ data: { userId: user.id, provider, providerUserId } });
  await recordAudit('User', user.id, 'PROVIDER_LINK', user.id, { provider });
  const token = signToken({ id: user.id, role: user.role });
  return success(res, { token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } }, 'Logged in');
}));

const providerLinkSchema = z.object({ provider: z.string().min(2), providerUserId: z.string().min(1) });
router.post('/provider/link', asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Unauthorized');
  const { provider, providerUserId } = providerLinkSchema.parse(req.body);
  await prisma.authProvider.create({ data: { userId: req.user.id, provider, providerUserId } });
  await recordAudit('User', req.user.id, 'PROVIDER_LINK', req.user.id, { provider });
  return success(res, { provider, providerUserId }, 'Provider linked', 201);
}));

module.exports = router;
