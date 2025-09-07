require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { v4: uuid } = require('uuid');
const routes = require('../routes');
const { notFound, errorHandler } = require('../middlewares/error');
const { success } = require('../utils/response');
const { config } = require('../utils/config');
const { prisma } = require('../utils/prisma');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));

const corsOrigins = config.corsOrigins;
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

app.use((req, res, next) => {
  const id = req.headers['x-request-id'] || uuid();
  req.id = id; res.setHeader('x-request-id', id); next();
});

morgan.token('id', (req) => req.id);
app.use(morgan(':id :method :url :status :response-time ms'));

const limiter = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false });
app.use(limiter);

app.get('/api/health', (_req, res) => success(res, { uptime: process.uptime(), env: config.env }, 'OK'));

// API routes
app.use('/api', routes);

// Docs
require('./docs').mountDocs(app);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`API listening on :${config.port}`);
});

async function shutdown(signal) {
  try {
    console.log(`\n${signal} received, shutting down...`);
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  } catch (e) {
    console.error('Shutdown error', e);
    process.exit(1);
  }
}
['SIGINT','SIGTERM'].forEach(sig => process.on(sig, () => shutdown(sig)));
