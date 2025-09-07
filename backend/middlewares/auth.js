const { verifyToken } = require('../utils/jwt');
const { ApiError } = require('../utils/response');

function authRequired(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.substring(7) : null;
    if (!token) throw new ApiError(401, 'Unauthorized');
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    next(new ApiError(401, 'Unauthorized'));
  }
}

function allowRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Unauthorized'));
    if (!roles.includes(req.user.role)) return next(new ApiError(403, 'Forbidden'));
    next();
  };
}

module.exports = { authRequired, allowRoles };
