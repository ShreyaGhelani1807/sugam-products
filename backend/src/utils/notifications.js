const prisma = require('../lib/prisma');

// Persists a row in the notifications table for audit/history.
// Best-effort: a logging failure must never break the main request flow.
async function recordNotification({ userId, orderId = null, channel, message, status = 'sent' }) {
  if (!userId) return;
  try {
    await prisma.notification.create({ data: { userId, orderId, channel, message, status } });
  } catch (err) {
    console.error('[Notification record error]', err.message);
  }
}

module.exports = { recordNotification };
