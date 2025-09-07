const { fail, ApiError } = require('../utils/response');

function notFound(_req, res) {
  return fail(res, 'Not Found', 404);
}

function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return fail(res, err.message || 'Error', err.status || 500, err.code, err.details);
  }
  console.error('UnhandledError:', err);
  return fail(res, 'Internal Server Error', 500);
}

module.exports = { notFound, errorHandler };
