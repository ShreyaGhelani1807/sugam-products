const prisma = require('../lib/prisma');

exports.list = async (req, res) => {
  const { search, category, limit } = req.query;
  try {
    const where = { isActive: true };
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
    if (category) where.category = category;
    const products = await prisma.product.findMany({ where, take: limit ? parseInt(limit) : undefined, orderBy: { createdAt: 'desc' } });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.detail = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};
