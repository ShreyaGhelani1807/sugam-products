// Validates environment configuration at boot. Fails fast on missing
// critical secrets so the app never starts in a half-configured state.
function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';

  // Always required — the app cannot function without these.
  const required = ['DATABASE_URL', 'JWT_SECRET'];

  // Required only in production (dev can run with mocks / test keys).
  const requiredInProd = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'FRONTEND_URL',
    // Email is the only notification channel — required so order confirmations
    // and supplier/customer status updates are actually delivered in production.
    'GMAIL_USER',
    'GMAIL_PASS',
  ];

  const missing = required.filter((k) => !process.env[k]);
  if (isProd) missing.push(...requiredInProd.filter((k) => !process.env[k]));

  if (missing.length) {
    console.error(`\n❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('   Set them in your .env (see .env.example) before starting.\n');
    process.exit(1);
  }

  if ((process.env.JWT_SECRET || '').length < 32) {
    console.error('\n❌ JWT_SECRET must be at least 32 characters.\n');
    process.exit(1);
  }

  if (!isProd) {
    const optional = ['RAZORPAY_KEY_ID', 'CLOUDINARY_CLOUD_NAME', 'GMAIL_USER'];
    const blank = optional.filter((k) => !process.env[k]);
    if (blank.length) {
      console.warn(`⚠️  Optional integrations not configured (mock/disabled): ${blank.join(', ')}`);
    }
  }
}

module.exports = { validateEnv };
