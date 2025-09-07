const { prisma } = require('../utils/prisma');

async function recordAudit(entityType, entityId, action, performedBy, changes) {
  try {
    await prisma.auditLog.create({ data: { entityType, entityId: entityId || null, action, performedBy: performedBy || null, changes: changes || {} } });
  } catch (e) {
    console.error('audit_error', e);
  }
}

module.exports = { recordAudit };
