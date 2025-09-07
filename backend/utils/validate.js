const { ApiError } = require('./response');

function validate(schema, pick = 'body') {
  return (req, _res, next) => {
    try {
      const data = schema.parse(req[pick] || {});
      req[pick] = data;
      next();
    } catch (e) {
      const details = e?.issues?.map(i => ({ path: i.path, message: i.message }));
      next(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', details));
    }
  };
}

module.exports = { validate };
