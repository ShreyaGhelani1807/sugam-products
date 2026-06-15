const prisma = require('../lib/prisma');
const { instance: razorpay, verifySignature } = require('../utils/razorpay');
const { finalizeOrderPayment } = require('../services/paymentService');

async function findSupplier(pincode, city) {
  // Try pincode match first
  if (pincode) {
    const coverage = await prisma.supplierCoverage.findFirst({
      where: { pincode, supplier: { isActive: true } },
      include: { supplier: true },
    });
    if (coverage) return coverage.supplier;
  }
  // Fall back to city match
  if (city) {
    const coverage = await prisma.supplierCoverage.findFirst({
      where: { city: { equals: city, mode: 'insensitive' }, supplier: { isActive: true } },
      include: { supplier: true },
    });
    if (coverage) return coverage.supplier;
  }
  return null;
}

// Finds a recent unpaid order belonging to this customer whose line items and
// total match the current cart, so its Razorpay order can be reused instead of
// creating a duplicate (prevents double-charge on retry). Returns the order
// (with its razorpayOrderId) or null.
async function findReusablePendingOrder(customerId, lineItems, total) {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000); // last 30 minutes
  const candidates = await prisma.order.findMany({
    where: {
      customerId,
      razorpayPaymentId: null,
      razorpayOrderId: { not: null },
      status: { in: ['PLACED', 'ASSIGNED'] },
      totalAmount: total,
      createdAt: { gte: cutoff },
    },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  const wanted = new Map(lineItems.map((li) => [li.productId, li.quantity]));
  const sameCart = (items) =>
    items.length === lineItems.length &&
    items.every((it) => wanted.get(it.productId) === it.quantity);

  return candidates.find((c) => sameCart(c.items)) || null;
}

exports.checkout = async (req, res) => {
  const { items, shippingAddress } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'Cart is empty' });

  try {
    // ── Server-side price authority ──────────────────────────────
    // NEVER trust client-supplied prices/totals. Refetch every product
    // from the DB, validate it, and recompute unit prices + total here.
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const lineItems = [];
    let total = 0;
    for (const i of items) {
      const product = productMap.get(i.productId);
      if (!product) return res.status(400).json({ error: `Product unavailable: ${i.productId}` });
      const quantity = parseInt(i.quantity, 10);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ error: 'Invalid quantity' });
      }
      const unitPrice = product.price; // authoritative price from DB
      total += unitPrice * quantity;
      lineItems.push({ productId: product.id, quantity, unitPrice });
    }
    total = Math.round(total * 100) / 100; // normalise to 2dp

    // ── Duplicate-payment guard (H2) ─────────────────────────────
    // If the customer already has a recent UNPAID order for this exact cart,
    // reuse its Razorpay order instead of creating a new one. A single Razorpay
    // order can only be paid once, so reusing it makes a retry idempotent and
    // removes the double-charge window when verify-payment fails client-side.
    const reuse = await findReusablePendingOrder(req.user.id, lineItems, total);
    if (reuse) {
      try {
        const existingRz = await razorpay.orders.fetch(reuse.razorpayOrderId);
        if (existingRz && existingRz.status !== 'paid') {
          return res.json({ razorpayOrder: existingRz, internalOrderId: reuse.id, reused: true });
        }
      } catch (e) {
        // Fall through and create a fresh order if the old one can't be fetched.
        console.warn('[checkout] could not reuse pending order:', e.message);
      }
    }

    // Find supplier by pincode/city
    const supplier = await findSupplier(shippingAddress?.pincode, shippingAddress?.city);

    // Create Razorpay order using the server-computed amount
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    // Create a pending order in DB
    const order = await prisma.order.create({
      data: {
        customerId: req.user.id,
        supplierId: supplier?.id || null,
        status: supplier ? 'ASSIGNED' : 'PLACED',
        totalAmount: total,
        razorpayOrderId: razorpayOrder.id,
        shippingAddress,
        items: { create: lineItems },
      },
    });

    res.json({ razorpayOrder, internalOrderId: order.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Checkout failed' });
  }
};

exports.verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, internalOrderId } = req.body;

  try {
    // ── Ownership check ──────────────────────────────────────────
    const existing = await prisma.order.findUnique({ where: { id: internalOrderId } });
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    if (existing.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorised for this order' });
    }

    // ── Order-id match: signature must be for THIS order ─────────
    if (existing.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ error: 'Order mismatch' });
    }

    // ── Idempotency: if already paid, return success without re-notifying ──
    if (existing.razorpayPaymentId) {
      const already = await prisma.order.findUnique({
        where: { id: internalOrderId },
        include: { customer: true, supplier: true, items: { include: { product: true } } },
      });
      return res.json({ message: 'Payment already verified', order: already });
    }

    // ── Signature verification ───────────────────────────────────
    const valid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!valid) return res.status(400).json({ error: 'Payment verification failed' });

    // Record payment + fire notifications via the shared, idempotent finalizer
    // (same code path the webhook and reconciliation use).
    const result = await finalizeOrderPayment(internalOrderId, razorpayPaymentId, { source: 'verify' });
    if (!result.ok) return res.status(404).json({ error: 'Order not found' });

    res.json({
      message: result.alreadyProcessed ? 'Payment already verified' : 'Payment verified',
      order: result.order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

exports.myOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: req.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.orderDetail = async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, customerId: req.user.id },
      include: { items: { include: { product: true } }, supplier: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};
