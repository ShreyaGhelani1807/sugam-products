# Legacy Catalog Migration — sugamproducts.com → new platform

Migrates the **40 products** from the old static PHP site into the new
Postgres/Prisma catalog. **Business content only** — no business-logic or
schema changes are made by these artifacts.

## Source of truth
- Old site extracted at: `D:/Projects/_sugam_old/sugamproducts.com`
- Products live in `ourproducts.php` (Bootstrap portfolio grid, inquiry-only).
- Thumbnails in `images/portfolio/fruit/` (+ `images/portfolio/vegitable/ginger.png`).

## Deliverables in this folder
| File | Purpose |
|------|---------|
| `products.csv` | All 40 products: name, slug, category, unit, price, features, description, image_path |
| `import-products.js` | Validates the CSV, uploads each thumbnail to Cloudinary, upserts by slug |
| `MIGRATION_PLAN.md` | This document |

---

## 1. Schema comparison (old site vs `Product` model)

| Old-site field | New `Product` column | Notes |
|----------------|----------------------|-------|
| Product name (`<h3>`) | `name` (String, required) | direct |
| — | `slug` (String, **@unique**, required) | generated, kebab-case |
| "Features:" list | folded into `description` | **no `features` column exists** |
| (none) | `description` (String?, optional) | generic line + "Features: …" |
| filter class (`bootstrap`/`joomla`) | `category` (String, required) | mapped → Fruit / Soda |
| **(none — inquiry only)** | `price` (Float, **required, must be > 0**) | **BLOCKING GAP** |
| (none) | `unit` (String, default `kg`) | defaulted to `kg` |
| `<img src>` thumbnail | `imageUrl` + `imagePublicId` | re-uploaded to Cloudinary |
| company PDFs (2, site-wide) | `mixingPdfUrl` (String?) | left null — no per-product PDFs |
| (none) | `isActive` (default true) | set true |

### Required schema changes: **NONE**
The current schema accommodates all extracted data **without modification**.
Two deliberate accommodations instead of schema changes:
- **Features** → folded into `description` (the import builds
  `"<desc> Features: a, b, c."`). Adding a dedicated `features` column is
  optional and out of scope (would touch business logic / UI).
- **Per-product PDFs** → none exist; `mixingPdfUrl` stays null.

---

## 2. Category mapping

Old UI exposed only two filters: **Fruit** (`.bootstrap`) and **Soda**
(`.joomla`). A few items carried stray `wordpress`/no class; mapped by nature.

| Old class | New `category` | Count |
|-----------|----------------|-------|
| `bootstrap` | **Fruit** | 22 |
| `joomla` | **Soda** | 14 |
| `wordpress` only (Fudina Masala, Ginger) | **Soda** | 2 |
| `wordpress bootstrap` (Lichy) | **Fruit** | 1 |
| none (Sahi Gulab) | **Soda** | 1 |

> ⚠️ **Decision needed:** the demo seed (`prisma/seed.js`) uses categories
> **Powder / Liquid**. This migration uses the old site's real taxonomy
> **Fruit / Soda**. Pick ONE scheme before launch so the storefront filter is
> coherent. Recommendation: use **Fruit / Soda** (matches the actual catalog)
> and drop the 4 demo seed products.

---

## 3. Image migration plan

- 40 thumbnails, all confirmed present on disk (dry-run reported **0 missing**).
- The import reuses the app's own `uploadProductImage()` → Sharp resize to
  WebP 800×800 → Cloudinary `sugam/products/` folder, storing both
  `secure_url` and `public_id` (same path as admin-created images).
- **Non-standard paths handled:**
  - `Banana.jpg` (only `.jpg`, capitalised) — mapped exactly.
  - `images/portfolio/vegitable/ginger.png` — different subfolder.
- ⚠️ **`Wisky.png` case bug (old site):** the Wiskey "View" link points to
  `Wisky.png` (capital W) which **does not exist**; only lowercase
  `wisky.png` is on disk. The CSV uses the real lowercase file, so the import
  is unaffected. (On the old Linux host that View link was simply broken.)
- These are small marketing thumbnails, not studio product shots — consider
  replacing with higher-res images post-launch (out of scope).

---

## 4. The blocking gap: prices

The old site is **inquiry-only** — it never had prices. The new schema requires
`price` to be a non-null `Float > 0`, and checkout/admin validate `isFloat({gt:0})`.

`products.csv` ships every row with `price=0` as a **placeholder**.
`import-products.js` **aborts the entire run** if any row still has `price <= 0`
(verified: the dry-run rejected all 40). This makes it impossible to launch a
₹0 product by accident — a direct money-loss guard.

**Action required from the business:** fill the `price` column in
`products.csv` with the real per-unit (₹/kg) price for each of the 40 products
before running the import.

---

## 5. Step-by-step execution sequence

Run **after** the database is provisioned and migrated (deployment Step:
`prisma migrate deploy` + first boot), but it can also be run locally against a
dev DB first.

```bash
cd backend

# 1. Set real prices — edit migration/products.csv, replace every price=0.
#    (Optional) adjust unit per product if not kg.

# 2. Validate without writing or uploading anything:
OLD_SITE_DIR="D:/Projects/_sugam_old/sugamproducts.com" \
  node migration/import-products.js --dry-run
#    → must print "✓ All rows valid"; fix any price/image errors it lists.

# 3. (Optional) preview rows without Cloudinary, leaving images null:
#    node migration/import-products.js --skip-images

# 4. Real import (uploads 40 images + upserts 40 rows, idempotent by slug):
OLD_SITE_DIR="D:/Projects/_sugam_old/sugamproducts.com" \
  CLOUDINARY_CLOUD_NAME=… CLOUDINARY_API_KEY=… CLOUDINARY_API_SECRET=… \
  DATABASE_URL="postgresql://…" \
  node migration/import-products.js

# 5. Verify: open the storefront / admin products list — expect 40 products,
#    each with an image, a Fruit/Soda category, and a non-zero price.

# 6. Remove the 4 demo seed products (Powder/Liquid) if the Fruit/Soda
#    taxonomy is chosen, so the category filter stays clean.
```

**Idempotency:** the import upserts by the unique `slug`, so it is safe to
re-run (e.g. after a price correction) — existing rows are updated in place,
not duplicated.

---

## Out of scope (unchanged, per instructions)
- No business-logic edits, no schema migration, no deployment.
- No new `features` column, no `mixingPdfUrl` content, no UI changes.
- Decisions left to the business: **prices** and **final category scheme**.
