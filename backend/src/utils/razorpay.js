const Razorpay = require('razorpay');
const crypto = require('crypto');

let _instance;
function getInstance() {
  if (_instance) return _instance;
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }
  _instance = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  return _instance;
}

// Lazy proxy so requiring this module never crashes the app at boot,
// but any actual Razorpay call fails fast if keys are missing.
const instance = {
  orders: {
    create: (...args) => getInstance().orders.create(...args),
    fetch: (...args) => getInstance().orders.fetch(...args),
    fetchPayments: (...args) => getInstance().orders.fetchPayments(...args),
  },
  payments: {
    fetch: (...args) => getInstance().payments.fetch(...args),
  },
};

function verifySignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_SECRET.');
  const body = orderId + '|' + paymentId;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  // Constant-time comparison to avoid timing attacks.
  const a = Buffer.from(expected);
  const b = Buffer.from(signature || '');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Verifies a Razorpay webhook payload. The signature (x-razorpay-signature
// header) is an HMAC-SHA256 of the RAW request body using the webhook secret
// configured in the Razorpay dashboard. `rawBody` must be the unparsed bytes.
function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error('Razorpay webhook is not configured. Set RAZORPAY_WEBHOOK_SECRET.');
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature || '');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { instance, verifySignature, verifyWebhookSignature };
