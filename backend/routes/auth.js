const express = require('express');
const { success } = require('../utils/response');
const { asyncHandler } = require('../utils/async');
const ctrl = require('../controllers/auth.controller');

const router = express.Router();

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

router.post('/register', asyncHandler(async (req, res) => {
  const data = await ctrl.register(req, res);
  return success(res, data, 'Registered', 201);
}));

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

router.post('/login', asyncHandler(async (req, res) => {
  const data = await ctrl.login(req, res);
  return success(res, data, 'Logged in');
}));

// Social provider login/link
const providerLoginSchema = z.object({ provider: z.string().min(2), providerUserId: z.string().min(1), email: z.string().email().optional(), fullName: z.string().optional() });
router.post('/provider/login', asyncHandler(async (req, res) => {
  const data = await ctrl.providerLogin(req, res);
  return success(res, data, 'Logged in');
}));

const providerLinkSchema = z.object({ provider: z.string().min(2), providerUserId: z.string().min(1) });
router.post('/provider/link', asyncHandler(async (req, res) => {
  const data = await ctrl.providerLink(req, res);
  return success(res, data, 'Provider linked', 201);
}));

router.get('/providers', asyncHandler(async (req, res) => {
  const data = await ctrl.listProviders(req, res);
  return success(res, data);
}));

router.delete('/provider/:provider/:providerUserId', asyncHandler(async (req, res) => {
  await ctrl.unlinkProvider(req, res);
  return success(res, null, 'Provider unlinked');
}));

module.exports = router;
