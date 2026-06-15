const prisma = require('../lib/prisma');
const { sendEmail, orderConfirmationHtml, escapeHtml } = require('../utils/email');
const { recordNotification } = require('../utils/notifications');

const ORDER_INCLUDE = {
  customer: true,
  supplier: true,
  items: { include: { product: true } },
};

// Idempotently records a successful payment against an order and fires the
// one-time post-payment notifications. Safe to call from the client
// verify-payment path, the Razorpay webhook, and the reconciliation job —
// only the first caller to win the conditional update sends notifications.
//
// Optional `amount` (paise) and `currency` let the webhook/reconcile paths
// assert that what Razorpay captured matches what we charged before recording
// the payment. The verify-payment path omits them: its HMAC signature already
// binds the payment to the server-created order amount.
//
// Returns: { ok, alreadyProcessed, reason?, order }
async function finalizeOrderPayment(orderId, paymentId, { source = 'verify', amount, currency } = {}) {
  // Load first so we can validate the amount BEFORE claiming the payment.
  const existing = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!existing) return { ok: false, reason: 'not_found' };

  const shortId = existing.id.slice(-8).toUpperCase();

  // Already finalized elsewhere — idempotent no-op.
  if (existing.razorpayPaymentId) {
    return { ok: true, alreadyProcessed: true, order: existing };
  }

  // Amount/currency assertion (defense for webhook + reconcile paths).
  if (amount != null) {
    const expectedPaise = Math.round(existing.totalAmount * 100);
    if (amount !== expectedPaise || (currency && currency !== 'INR')) {
      console.error(
        `[payment] AMOUNT MISMATCH order #${shortId}: expected ${expectedPaise} INR, ` +
        `got ${amount} ${currency || '?'} (payment ${paymentId}, source ${source}). Not finalizing.`
      );
      return { ok: false, reason: 'amount_mismatch', order: existing };
    }
  }

  // Atomic claim: only succeeds if this order has not been paid yet.
  // This is the idempotency + race guard — concurrent callers cannot both win.
  const claim = await prisma.order.updateMany({
    where: { id: orderId, razorpayPaymentId: null },
    data: { razorpayPaymentId: paymentId },
  });

  if (claim.count === 0) {
    // Lost the race — another caller finalized between our read and claim.
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
    return { ok: true, alreadyProcessed: true, order };
  }

  // We won the claim — reload and send notifications exactly once.
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });

  // Customer order-confirmation email (email is the only notification channel).
  if (order.customer?.email) {
    const result = await sendEmail({
      to: order.customer.email,
      subject: `Order Confirmed — #${shortId}`,
      html: orderConfirmationHtml(order),
    });
    await recordNotification({
      userId: order.customerId,
      orderId: order.id,
      channel: 'email',
      message: `Order confirmation email for #${shortId}.`,
      status: result.sent ? 'sent' : 'failed',
    });
  }

  // Supplier new-order email.
  if (order.supplier) {
    const supplierUser = await prisma.user.findFirst({ where: { supplier: { id: order.supplier.id } } });
    if (supplierUser?.email) {
      const city = order.shippingAddress?.city || 'Unknown';
      const result = await sendEmail({
        to: supplierUser.email,
        subject: `New Order Assigned — #${shortId}`,
        html: `<p>A new order <strong>#${shortId}</strong> has been assigned to you for delivery to <strong>${escapeHtml(city)}</strong>. Please log in to your supplier dashboard to view and accept it.</p>`,
      });
      await recordNotification({
        userId: supplierUser.id,
        orderId: order.id,
        channel: 'email',
        message: `New order #${shortId} assigned for ${city}.`,
        status: result.sent ? 'sent' : 'failed',
      });
    }
  }

  console.log(`[payment] order ${shortId} finalized via ${source} (payment ${paymentId})`);
  return { ok: true, alreadyProcessed: false, order };
}

module.exports = { finalizeOrderPayment };
