const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { prisma } = require('../utils/prisma');
const { success, ApiError } = require('../utils/response');
const { signToken } = require('../utils/jwt');

const router = express.Router();

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

router.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new ApiError(409, 'Email already registered');
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: { fullName: input.fullName, email: input.email, passwordHash, phone: input.phone || null },
    });
    await prisma.cart.create({ data: { userId: user.id } });
    const token = signToken({ id: user.id, role: user.role });
    return success(res, { token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } }, 'Registered', 201);
  } catch (e) { next(e); }
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new ApiError(401, 'Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new ApiError(401, 'Invalid credentials');
    const token = signToken({ id: user.id, role: user.role });
    return success(res, { token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } }, 'Logged in');
  } catch (e) { next(e); }
});

module.exports = router;
