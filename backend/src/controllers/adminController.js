const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const { uploadProductImage, deleteProductImage } = require('../utils/imageUpload');
const { reconcilePayments } = require('../services/reconciliationService');

// ─── Analytics ───────────────────────────────────────────────
exports.analyticsOverview = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [totalOrders, ordersThisMonth, pendingOrders, activeSuppliers, revenueMonth, revenueYear] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.order.count({ where: { status: { in: ['PLACED', 'ASSIGNED', 'ACCEPTED'] } } }),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: startOfMonth } } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: startOfYear } } }),
    ]);

    res.json({
      totalOrders,
      ordersThisMonth,
      pendingOrders,
      activeSuppliers,
      revenueThisMonth: revenueMonth._sum.totalAmount || 0,
      revenueThisYear: revenueYear._sum.totalAmount || 0,
    });
  } catch { res.status(500).json({ error: 'Failed to fetch analytics' }); }
};

exports.analyticsMonthly = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const results = await Promise.all(
      months.map(async (month, i) => {
        const start = new Date(year, i, 1);
        const end = new Date(year, i + 1, 1);
        const [agg, count] = await Promise.all([
          prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: start, lt: end } } }),
          prisma.order.count({ where: { createdAt: { gte: start, lt: end } } }),
        ]);
        return { month, revenue: agg._sum.totalAmount || 0, orders: count };
      })
    );
    res.json(results);
  } catch { res.status(500).json({ error: 'Failed to fetch monthly analytics' }); }
};

exports.analyticsProducts = async (req, res) => {
  try {
    const items = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, unitPrice: true },
      orderBy: { _sum: { unitPrice: 'desc' } },
    });
    const enriched = await Promise.all(items.map(async (item) => {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      return { productId: item.productId, name: product?.name, unit: product?.unit, totalQuantity: item._sum.quantity, totalRevenue: (item._sum.quantity || 0) * (item._sum.unitPrice || 0) };
    }));
    res.json(enriched);
  } catch { res.status(500).json({ error: 'Failed to fetch product analytics' }); }
};

// ─── Orders ──────────────────────────────────────────────────
exports.listOrders = async (req, res) => {
  const { status, search } = req.query;
  try {
    const where = {};
    if (status) where.status = status;
    if (search) where.OR = [
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { id: { contains: search, mode: 'insensitive' } },
    ];
    const orders = await prisma.order.findMany({
      where,
      include: { customer: true, supplier: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch { res.status(500).json({ error: 'Failed to fetch orders' }); }
};

exports.updateOrder = async (req, res) => {
  const { supplierId, status } = req.body;
  try {
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { supplierId, status } });
    res.json(order);
  } catch { res.status(500).json({ error: 'Failed to update order' }); }
};

// ─── Products ─────────────────────────────────────────────────
exports.listProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(products);
  } catch { res.status(500).json({ error: 'Failed to fetch products' }); }
};

exports.createProduct = async (req, res) => {
  try {
    let imageUrl, imagePublicId;
    if (req.file) {
      const uploaded = await uploadProductImage(req.file.buffer);
      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;
    }
    const { name, slug, description, category, price, unit, isActive } = req.body;
    const product = await prisma.product.create({
      data: { name, slug, description, category, price: parseFloat(price), unit: unit || 'kg', imageUrl, imagePublicId, isActive: isActive !== 'false' },
    });
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const { name, slug, description, category, price, unit, isActive } = req.body;
    const data = { name, slug, description, category, unit };
    if (price) data.price = parseFloat(price);
    if (isActive !== undefined) data.isActive = isActive !== 'false';

    if (req.file) {
      const uploaded = await uploadProductImage(req.file.buffer);
      data.imageUrl = uploaded.url;
      data.imagePublicId = uploaded.publicId;
    }

    const product = await prisma.product.update({ where: { id: req.params.id }, data });

    // Remove the old Cloudinary asset only after the DB update succeeds.
    if (req.file && existing.imagePublicId) await deleteProductImage(existing.imagePublicId);

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Product deactivated' });
  } catch { res.status(500).json({ error: 'Failed to delete product' }); }
};

// ─── Suppliers ────────────────────────────────────────────────
exports.listSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({ include: { coverage: true }, orderBy: { createdAt: 'desc' } });
    res.json(suppliers);
  } catch { res.status(500).json({ error: 'Failed to fetch suppliers' }); }
};

exports.createSupplier = async (req, res) => {
  const { businessName, contactName, phone, email, gstin, password } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name: contactName, email, phone, passwordHash, role: 'supplier' } });
    const supplier = await prisma.supplier.create({
      data: { userId: user.id, businessName, contactName, phone, email, gstin },
      include: { coverage: true },
    });
    res.status(201).json(supplier);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
};

exports.updateSupplier = async (req, res) => {
  const { businessName, contactName, phone, email, gstin, isActive } = req.body;
  try {
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: { businessName, contactName, phone, email, gstin, isActive: isActive !== undefined ? Boolean(isActive) : undefined },
      include: { coverage: true },
    });
    res.json(supplier);
  } catch { res.status(500).json({ error: 'Failed to update supplier' }); }
};

exports.deleteSupplier = async (req, res) => {
  try {
    await prisma.supplier.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Supplier deactivated' });
  } catch { res.status(500).json({ error: 'Failed to deactivate supplier' }); }
};

exports.addCoverage = async (req, res) => {
  const { city, pincode, state } = req.body;
  try {
    const coverage = await prisma.supplierCoverage.create({ data: { supplierId: req.params.id, city, pincode: pincode || null, state } });
    res.status(201).json(coverage);
  } catch { res.status(500).json({ error: 'Failed to add coverage' }); }
};

exports.removeCoverage = async (req, res) => {
  try {
    await prisma.supplierCoverage.delete({ where: { id: req.params.covId } });
    res.json({ message: 'Coverage removed' });
  } catch { res.status(500).json({ error: 'Failed to remove coverage' }); }
};

// ─── Customers ────────────────────────────────────────────────
exports.listCustomers = async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'customer' },
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const enriched = await Promise.all(customers.map(async (c) => {
      const agg = await prisma.order.aggregate({ _sum: { totalAmount: true }, where: { customerId: c.id } });
      return { ...c, totalSpent: agg._sum.totalAmount || 0 };
    }));
    res.json(enriched);
  } catch { res.status(500).json({ error: 'Failed to fetch customers' }); }
};

// ─── Sample Requests ──────────────────────────────────────────
exports.listSamples = async (req, res) => {
  try {
    const samples = await prisma.sampleRequest.findMany({ include: { product: true }, orderBy: { createdAt: 'desc' } });
    res.json(samples);
  } catch { res.status(500).json({ error: 'Failed to fetch samples' }); }
};

exports.updateSample = async (req, res) => {
  try {
    const sample = await prisma.sampleRequest.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    res.json(sample);
  } catch { res.status(500).json({ error: 'Failed to update sample' }); }
};

// ─── Payment Reconciliation ───────────────────────────────────
// POST /api/admin/reconcile        → detect + repair paid-but-unrecorded orders
// POST /api/admin/reconcile?dryRun=1 → report only
exports.reconcile = async (req, res) => {
  try {
    const repair = req.query.dryRun !== '1' && req.query.dryRun !== 'true';
    const report = await reconcilePayments({ repair });
    res.json(report);
  } catch (err) {
    console.error('[admin reconcile]', err.message);
    res.status(500).json({ error: 'Reconciliation failed' });
  }
};
