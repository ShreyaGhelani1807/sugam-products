const prisma = require('../lib/prisma');
const { sendEmail, escapeHtml } = require('../utils/email');
const { recordNotification } = require('../utils/notifications');

// Allowed forward transitions for a supplier-handled order.
// ASSIGNED → ACCEPTED → DISPATCHED → DELIVERED
const NEXT_STATUS = {
  ASSIGNED: 'ACCEPTED',
  ACCEPTED: 'DISPATCHED',
  DISPATCHED: 'DELIVERED',
};

async function getSupplierRecord(userId) {
  return prisma.supplier.findUnique({ where: { userId } });
}

exports.listOrders = async (req, res) => {
  try {
    const supplier = await getSupplierRecord(req.user.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    const orders = await prisma.order.findMany({
      where: { supplierId: supplier.id },
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.orderDetail = async (req, res) => {
  try {
    const supplier = await getSupplierRecord(req.user.id);
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, supplierId: supplier?.id },
      include: { customer: true, items: { include: { product: true } } },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['ACCEPTED', 'DISPATCHED', 'DELIVERED'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const supplier = await getSupplierRecord(req.user.id);
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, supplierId: supplier?.id },
      include: { customer: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // ── State-machine enforcement ────────────────────────────────
    // The new status must be the single valid next step from current.
    if (NEXT_STATUS[order.status] !== status) {
      return res.status(409).json({
        error: `Invalid transition: ${order.status} → ${status}. Allowed next: ${NEXT_STATUS[order.status] || 'none'}.`,
      });
    }

    const updated = await prisma.order.update({ where: { id: req.params.id }, data: { status } });

    const shortId = order.id.slice(-8).toUpperCase();
    const statusLabel = { ACCEPTED: 'accepted', DISPATCHED: 'dispatched', DELIVERED: 'delivered' };
    // Email notification to customer + audit record
    let emailResult = { sent: false };
    if (order.customer?.email) {
      emailResult = await sendEmail({
        to: order.customer.email,
        subject: `Order #${shortId} ${statusLabel[status] || status}`,
        html: `<p>Hi ${escapeHtml(order.customer.name || '')},</p><p>Your order <strong>#${shortId}</strong> has been <strong>${statusLabel[status] || status}</strong>.</p><p>Thank you for choosing Sugam Products!</p>`,
      });
    }
    await recordNotification({
      userId: order.customerId,
      orderId: order.id,
      channel: 'email',
      message: `Order #${shortId} status updated to ${status}.`,
      status: emailResult.sent ? 'sent' : 'failed',
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update status' });
  }
};
