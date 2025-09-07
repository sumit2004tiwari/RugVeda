const express = require('express');
const { success } = require('../utils/response');
const { authRequired } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');
const ctrl = require('../controllers/cart.controller');

const router = express.Router();

router.get('/', authRequired, asyncHandler(async (req, res) => {
  const data = await ctrl.getCart(req);
  return success(res, data);
}));

router.post('/items', authRequired, asyncHandler(async (req, res) => {
  const data = await ctrl.addItem(req);
  return success(res, data, 'Item added', 201);
}));

router.put('/items/:id', authRequired, asyncHandler(async (req, res) => {
  const data = await ctrl.updateItem(req);
  return success(res, data, 'Item updated');
}));

router.delete('/items/:id', authRequired, asyncHandler(async (req, res) => {
  await ctrl.removeItem(req);
  return success(res, null, 'Item removed');
}));

module.exports = router;
