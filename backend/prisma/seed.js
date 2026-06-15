require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // ── Admin ────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@sugamproducts.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
  const adminHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { name: 'Sugam Admin', email: adminEmail, phone: '+919999999999', passwordHash: adminHash, role: 'admin' },
  });
  console.log(`✔ Admin ready: ${adminEmail} / ${adminPassword}`);

  // ── Products ─────────────────────────────────────────────────
  const products = [
    { name: 'Orange Essence Powder', slug: 'orange-essence-powder', category: 'Powder', price: 450, unit: 'kg', description: 'Concentrated orange flavouring powder for soft drinks.' },
    { name: 'Cola Flavour Liquid', slug: 'cola-flavour-liquid', category: 'Liquid', price: 620, unit: 'litre', description: 'Premium cola flavour concentrate.' },
    { name: 'Lemon Essence Powder', slug: 'lemon-essence-powder', category: 'Powder', price: 480, unit: 'kg', description: 'Tangy lemon flavouring agent.' },
    { name: 'Mango Flavour Liquid', slug: 'mango-flavour-liquid', category: 'Liquid', price: 700, unit: 'litre', description: 'Rich Alphonso mango flavour concentrate.' },
  ];
  for (const p of products) {
    await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }
  console.log(`✔ Seeded ${products.length} products`);

  // ── Supplier + coverage ──────────────────────────────────────
  const supplierEmail = 'supplier.mumbai@sugamproducts.com';
  const supplierHash = await bcrypt.hash('Supplier@12345', 12);
  const supplierUser = await prisma.user.upsert({
    where: { email: supplierEmail },
    update: {},
    create: { name: 'Mumbai Distributor', email: supplierEmail, phone: '+919888888888', passwordHash: supplierHash, role: 'supplier' },
  });
  const existingSupplier = await prisma.supplier.findUnique({ where: { userId: supplierUser.id } });
  if (!existingSupplier) {
    await prisma.supplier.create({
      data: {
        userId: supplierUser.id,
        businessName: 'Mumbai Beverage Distributors',
        contactName: 'Mumbai Distributor',
        phone: '+919888888888',
        email: supplierEmail,
        coverage: {
          create: [
            { city: 'Mumbai', pincode: '400001', state: 'Maharashtra' },
            { city: 'Pune', pincode: '411001', state: 'Maharashtra' },
          ],
        },
      },
    });
    console.log('✔ Seeded supplier with coverage (Mumbai/Pune)');
  } else {
    console.log('✔ Supplier already exists');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
