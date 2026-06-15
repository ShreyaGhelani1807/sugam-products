const prisma = require('../lib/prisma');
const { instance: razorpay } = require('../utils/razorpay');
const { finalizeOrderPayment } = require('./paymentService');

// Compares DB orders that have a Razorpay order id but no recorded payment
// against Razorpay's records. Any order Razorpay reports as captured but the
// DB still shows unpaid is a "paid-but-unrecorded" order — the exact failure a
// server crash between payment and verify-payment produces. When repair=true,
// these are finalized through the shared idempotent path.
//
// Returns a structured reconciliation report.
async function reconcilePayments({ repair = true } = {}) {
  const startedAt = new Date();

  const pending = await prisma.order.findMany({
    where: { razorpayOrderId: { not: null }, razorpayPaymentId: null },
    select: { id: true, razorpayOrderId: true, totalAmount: true, status: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const report = {
    generatedAt: startedAt.toISOString(),
    mode: repair ? 'repair' : 'report-only',
    checked: pending.length,
    repaired: [],
    paidButUnrecorded: [],
    stillPending: [],
    errors: [],
  };

  for (const order of pending) {
    const shortId = order.id.slice(-8).toUpperCase();
    try {
      const payments = await razorpay.orders.fetchPayments(order.razorpayOrderId);
      const captured = (payments?.items || []).find((p) => p.status === 'captured');

      if (!captured) {
        report.stillPending.push({ orderId: order.id, shortId, razorpayOrderId: order.razorpayOrderId });
        continue;
      }

      // Razorpay says this order was paid but our DB never recorded it.
      report.paidButUnrecorded.push({ orderId: order.id, shortId, paymentId: captured.id });

      if (repair) {
        const result = await finalizeOrderPayment(order.id, captured.id, {
          source: 'reconcile',
          amount: captured.amount,
          currency: captured.currency,
        });
        if (!result.ok && result.reason === 'amount_mismatch') {
          report.errors.push({ orderId: order.id, shortId, error: 'amount_mismatch' });
        } else {
          report.repaired.push({
            orderId: order.id,
            shortId,
            paymentId: captured.id,
            amount: order.totalAmount,
            alreadyProcessed: !!result.alreadyProcessed,
          });
        }
      }
    } catch (err) {
      report.errors.push({ orderId: order.id, shortId, error: err.message });
    }
  }

  report.summary = {
    checked: report.checked,
    paidButUnrecorded: report.paidButUnrecorded.length,
    repaired: report.repaired.length,
    stillPending: report.stillPending.length,
    errors: report.errors.length,
  };

  return report;
}

module.exports = { reconcilePayments };
