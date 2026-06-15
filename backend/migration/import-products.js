// One-off catalog import: loads the 40 legacy Sugam products from
// migration/products.csv, uploads each thumbnail to Cloudinary (reusing the
// app's own uploadProductImage helper so images get the same WebP/folder
// treatment as admin-created products), and upserts each row into the
// products table by its unique slug.
//
// USAGE
//   OLD_SITE_DIR="D:/Projects/_sugam_old/sugamproducts.com" \
//     node migration/import-products.js            # upload images + write rows
//   node migration/import-products.js --dry-run    # validate CSV only, no writes
//   node migration/import-products.js --skip-images # write rows, leave imageUrl null
//
// PRECONDITIONS
//   - DATABASE_URL set (writes to the products table).
//   - CLOUDINARY_* set unless --skip-images / --dry-run.
//   - OLD_SITE_DIR points at the extracted old-site root (the folder that
//     contains images/portfolio/...). Defaults to ../_sugam_old/sugamproducts.com
//     relative to the repo if not set.
//   - Every CSV row must have price > 0. The old site was inquiry-only and had
//     NO prices, so products.csv ships with price=0 placeholders. This script
//     ABORTS before writing anything if any row still has price <= 0, so a
//     half-priced catalog can never go live (a ₹0 product is a money-loss bug).
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prisma = require('../src/lib/prisma');
const { uploadProductImage } = require('../src/utils/imageUpload');

const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_IMAGES = process.argv.includes('--skip-images');

const OLD_SITE_DIR =
  process.env.OLD_SITE_DIR ||
  path.resolve(__dirname, '..', '..', '..', '_sugam_old', 'sugamproducts.com');

const CSV_PATH = path.join(__dirname, 'products.csv');

// Minimal RFC-4180-ish CSV parser (handles double-quoted fields with commas).
function parseCsv(text) {
  const rows = [];
  let field = '';
  let record = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      record.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      if (field !== '' || record.length) { record.push(field); rows.push(record); record = []; field = ''; }
    } else field += c;
  }
  if (field !== '' || record.length) { record.push(field); rows.push(record); }
  const header = rows.shift();
  return rows.map((r) => Object.fromEntries(header.map((h, idx) => [h, (r[idx] ?? '').trim()])));
}

function buildDescription(row) {
  const base = row.description ? row.description.trim() : '';
  const feats = row.features ? row.features.split(';').map((f) => f.trim()).filter(Boolean) : [];
  if (!feats.length) return base || null;
  return `${base ? base + ' ' : ''}Features: ${feats.join(', ')}.`;
}

async function main() {
  const rows = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'));
  console.log(`Parsed ${rows.length} rows from products.csv`);

  // ── Validate everything up front; abort the whole run on any problem ──
  const errors = [];
  const seenSlugs = new Set();
  for (const row of rows) {
    if (!row.name) errors.push(`row missing name: ${JSON.stringify(row)}`);
    if (!row.slug) errors.push(`${row.name}: missing slug`);
    if (seenSlugs.has(row.slug)) errors.push(`${row.name}: duplicate slug "${row.slug}"`);
    seenSlugs.add(row.slug);
    if (!row.category) errors.push(`${row.name}: missing category`);
    const price = Number(row.price);
    if (!Number.isFinite(price) || price <= 0) {
      errors.push(`${row.name}: price must be > 0 (got "${row.price}") — set real prices before import`);
    }
    if (!SKIP_IMAGES) {
      const img = path.join(OLD_SITE_DIR, row.image_path);
      if (!fs.existsSync(img)) errors.push(`${row.name}: image not found at ${img}`);
    }
  }
  if (errors.length) {
    console.error(`\n✗ Aborting — ${errors.length} validation error(s). No rows written:\n`);
    errors.forEach((e) => console.error('  - ' + e));
    process.exitCode = 1;
    return;
  }
  console.log('✓ All rows valid' + (SKIP_IMAGES ? ' (image check skipped)' : ' (prices set, images present)'));

  if (DRY_RUN) {
    console.log('--dry-run: validation only, nothing written.');
    return;
  }

  let created = 0;
  let updated = 0;
  for (const row of rows) {
    let imageUrl = null;
    let imagePublicId = null;
    if (!SKIP_IMAGES) {
      const buffer = fs.readFileSync(path.join(OLD_SITE_DIR, row.image_path));
      const uploaded = await uploadProductImage(buffer);
      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;
    }

    const data = {
      name: row.name,
      category: row.category,
      price: Number(row.price),
      unit: row.unit || 'kg',
      description: buildDescription(row),
      isActive: true,
    };
    if (!SKIP_IMAGES) { data.imageUrl = imageUrl; data.imagePublicId = imagePublicId; }

    const existing = await prisma.product.findUnique({ where: { slug: row.slug } });
    await prisma.product.upsert({
      where: { slug: row.slug },
      update: data,
      create: { ...data, slug: row.slug },
    });
    existing ? updated++ : created++;
    console.log(`  ${existing ? '↻' : '＋'} ${row.name} (${row.category})`);
  }

  console.log(`\n✓ Done. Created ${created}, updated ${updated}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('\n✗ Import failed:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
