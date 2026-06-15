const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { validateEnv } = require('./config/env');
validateEnv();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const supplierRoutes = require('./routes/supplier');
const adminRoutes = require('./routes/admin');
const sampleRoutes = require('./routes/samples');
const webhookRoutes = require('./routes/webhooks');

const app = express();

// Behind Vercel/Railway proxies — required so express-rate-limit and req.ip
// key on the real client IP instead of the proxy.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
// Capture the raw body so the Razorpay webhook can verify its HMAC signature
// (which is computed over the exact bytes, not the parsed JSON).
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true }));

// Global baseline limiter — protects every endpoint from flooding. Webhooks
// (Razorpay retries) and the health check are exempt.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/health' || req.path.startsWith('/api/webhooks'),
});
app.use(globalLimiter);

const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: 'Too many requests, please try again later.' } });
const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 100, message: { error: 'Too many requests, please try again later.' } });
const supplierLimiter = rateLimit({ windowMs: 60 * 1000, max: 100, message: { error: 'Too many requests, please try again later.' } });
app.use('/api/auth', authLimiter);
app.use('/api/admin', adminLimiter);
app.use('/api/supplier', supplierLimiter);

app.use('/api/webhooks', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/samples', sampleRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Centralised error handler. Full details are logged server-side, but the
// client never receives internal error messages/stack traces in production
// (information disclosure). 4xx client errors keep their explicit messages.
app.use((err, req, res, next) => {
  console.error(err.stack || err.message || err);
  const status = err.status || 500;
  const isClientError = status >= 400 && status < 500;
  const message =
    isClientError || process.env.NODE_ENV !== 'production'
      ? err.message || 'Internal server error'
      : 'Internal server error';
  res.status(status).json({ error: message });
});

module.exports = app;
