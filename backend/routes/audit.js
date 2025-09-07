const express = require('express');
const { prisma } = require('../utils/prisma');
const { success } = require('../utils/response');
const { authRequired, allowRoles } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/async');

const router = express.Router();

router.get('/', authRequired, allowRoles('ADMIN'), asyncHandler(async (req, res) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { performedAt: 'desc' }, take: 200 });
  return success(res, logs);
}));

module.exports = router;
