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
  const created = await ctrl.create(req);
  return success(res, created, 'Product created', 201);
}));

router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const item = await ctrl.getBySlug(req);
  return success(res, item);
}));

router.put('/:id', authRequired, allowRoles('ADMIN', 'VENDOR'), asyncHandler(async (req, res) => {
  const updated = await ctrl.update(req);
  return success(res, updated, 'Product updated');
}));

router.delete('/:id', authRequired, allowRoles('ADMIN', 'VENDOR'), asyncHandler(async (req, res) => {
  await ctrl.remove(req);
  return success(res, null, 'Product deleted');
}));

module.exports = router;
