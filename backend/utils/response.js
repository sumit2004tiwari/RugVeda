function success(res, data = null, message = "OK", status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message = "Error", status = 400, code = undefined, details = undefined) {
  return res.status(status).json({ success: false, message, code, details });
}

class ApiError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status || 500;
    this.code = code;
    this.details = details;
  }
}

module.exports = { success, fail, ApiError };
