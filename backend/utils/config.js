const toArray = (v) => (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []);

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  corsOrigins: toArray(process.env.CORS_ORIGINS || '*'),
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

module.exports = { config };
