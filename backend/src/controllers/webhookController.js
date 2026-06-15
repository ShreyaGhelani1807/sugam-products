const prisma = require('../lib/prisma');
const { verifyWebhookSignature } = require('../utils/razorpay');
const { finalizeOrderPayment } = require('../services/paymentService');

// Razorpay webhook receiver. Razorpay retries on non-2xx, so once the
// signature is valid we always return 200 and process idempotently.
exports.razorpay = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];

  // req.rawBody is captured by the express.json verify hook in app.js — the
  // signature is an HMAC over the raw bytes, so the parsed object cannot be used.
  let valid;
  try {
    valid = verifyWebhookSignature(req.rawBody, signature);
  } catch (err) {
    console.error('[webhook] not configured:', err.message);
    return res.status(503).json({ error: 'Webhook not configured' });
  }
  if (!valid) {
    console.warn('[webhook] invalid signature rejected');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = req.body?.event;
  const paymentEntity = req.body?.payload?.payment?.entity;

  try {
    if (event === 'payment.captured' || event === 'order.paid') {
      const razorpayOrderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (razorpayOrderId && paymentId) {
        const order = await prisma.order.findFirst({ where: { razorpayOrderId } });
        if (!order) {
          console.warn(`[webhook] ${event}: no DB order for razorpay order ${razorpayOrderId}`);
        } else {
          const result = await finalizeOrderPayment(order.id, paymentId, {
            source: 'webhook',
            amount: paymentEntity?.amount,
            currency: paymentEntity?.currency,
          });
          const shortId = order.id.slice(-8).toUpperCase();
          if (result.reason === 'amount_mismatch') {
            console.error(`[webhook] ${event} order #${shortId}: REJECTED — captured amount does not match order total.`);
          } else {
            console.log(
              `[webhook] ${event} order #${shortId}: ${
                result.alreadyProcessed ? 'already processed (idempotent)' : 'recorded'
              }`
            );
          }
        }
      }
    } else {
      console.log(`[webhook] ignored event: ${event}`);
    }
  } catch (err) {
    // Log but still 200 — re-delivery would hit the same error. Reconciliation
    // is the backstop for anything that fails here.
    console.error('[webhook] processing error:', err.message);
  }

  return res.json({ received: true });
};
