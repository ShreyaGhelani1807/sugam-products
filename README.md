# Sugam Products — B2B E-Commerce Platform

Full-stack B2B e-commerce platform for Sugam Products Pvt. Ltd. — a flavouring agents and essences supplier for soft drink manufacturers.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| State | Zustand + TanStack React Query |
| Backend | Node.js + Express |
| Database | PostgreSQL (Railway) + Prisma ORM |
| Auth | JWT (role-based: customer / supplier / admin) |
| Payments | Razorpay |
| Notifications | Email (Nodemailer + Gmail SMTP) |
| Storage | Cloudinary (WebP images via Sharp) |
| Deployment | Vercel (frontend) + Railway (backend + PostgreSQL) |

> **Prisma is pinned to v6.x.** Prisma 7 removed `url = env(...)` from the schema datasource and requires a driver-adapter config; v6 keeps the classic `new PrismaClient()` flow this codebase uses.

---

## Project Structure

```
Sugam Products Final/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/    # Shared UI + layouts
│   │   ├── features/      # auth modal
│   │   ├── hooks/         # useAuth, useCart, useOrders, useProducts, useAnalytics
│   │   ├── lib/           # api.js (axios), queryClient.js
│   │   ├── pages/         # All route-level pages
│   │   ├── router/        # React Router config + ProtectedRoute
│   │   ├── store/         # Zustand stores (auth, cart)
│   │   └── utils/         # formatters, cn
│   └── .env
└── backend/           # Express API
    ├── src/
    │   ├── controllers/   # Route handlers
    │   ├── middleware/    # auth, upload
    │   ├── routes/        # auth, products, orders, supplier, admin, samples
    │   └── utils/         # jwt, email, razorpay, imageUpload, notifications
    ├── prisma/
    │   └── schema.prisma  # Full DB schema
    └── .env
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- A [Railway](https://railway.app) project with a PostgreSQL plugin
- A [Razorpay](https://razorpay.com) account (test keys)
- A [Cloudinary](https://cloudinary.com) account (free tier) — image storage
- A Gmail account with an App Password (for SMTP email notifications)

### 1. Clone & Install

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Configure Environment

**Backend** — edit `backend/.env`:
```
DATABASE_URL="postgresql://postgres:PASSWORD@HOST.proxy.rlwy.net:PORT/railway"
JWT_SECRET="your-random-secret-min-32-chars"
RAZORPAY_KEY_ID="rzp_test_xxxxx"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
RAZORPAY_WEBHOOK_SECRET="your-razorpay-webhook-secret"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
GMAIL_USER="you@gmail.com"
GMAIL_PASS="your-gmail-app-password"
```
> In `production` (`NODE_ENV=production`) the server **fails to boot** unless `DATABASE_URL`, `JWT_SECRET`, all `RAZORPAY_*` (including `RAZORPAY_WEBHOOK_SECRET`), all `CLOUDINARY_*`, and `FRONTEND_URL` are set. In development, missing integrations fall back to mock/disabled mode.

**Frontend** — edit `frontend/.env`:
```
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### 3. Set Up Database

```bash
cd backend
npx prisma generate          # Generate Prisma client (v6)
npx prisma migrate deploy    # Apply migrations to Railway PostgreSQL (prod strategy)
# For local iteration on the schema use: npx prisma migrate dev --name <change>
npm run db:seed              # Seed admin user + sample products/supplier
```

> **Migration strategy:** this project uses **Prisma migrations** (`prisma/migrations/`),
> not `db push`. Production applies them automatically — the `start` script runs
> `prisma migrate deploy` before booting. If you have an existing database that was
> created with `db push` (no migration history), baseline it once with
> `npx prisma migrate resolve --applied 0_init` before the first `migrate deploy`.

### 4. Configure Cloudinary

Create a free Cloudinary account and copy the **Cloud name**, **API Key**, and **API Secret** from the dashboard into `backend/.env`. Images are resized to WebP via Sharp and uploaded to the `sugam/products` folder. The Cloudinary `public_id` is stored alongside the URL so images can be replaced/deleted.

### 5. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev    # Runs on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev    # Runs on http://localhost:5173
```

---

## User Roles

| Role | Access | Login |
|------|--------|-------|
| **Customer** | Public site + customer portal | Self-register at checkout |
| **Supplier** | Supplier portal (`/supplier`) | Created by admin |
| **Admin** | Full admin dashboard (`/admin`) | Created manually in DB |

### Create First Admin User

The seed script creates an admin automatically:

```bash
cd backend
npm run db:seed
# Default admin: admin@sugamproducts.com / Admin@12345
# Override with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD env vars.
```

> **Change the default admin password immediately after first login in production.**

---

## API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Customer registration |
| POST | `/api/auth/login` | — | Login (any role) |
| GET | `/api/auth/me` | JWT | Current user |
| GET | `/api/products` | — | List products (`?search=&category=`) |
| GET | `/api/products/:slug` | — | Product detail |
| POST | `/api/orders/checkout` | Customer | Create Razorpay order + assign supplier |
| POST | `/api/orders/verify-payment` | Customer | Verify payment + create order |
| GET | `/api/orders/my` | Customer | My order history |
| GET | `/api/supplier/orders` | Supplier | Assigned orders |
| PATCH | `/api/supplier/orders/:id/status` | Supplier | Update order status |
| GET | `/api/admin/analytics/overview` | Admin | KPI totals |
| GET | `/api/admin/analytics/monthly` | Admin | Monthly chart data |
| GET/POST/PATCH/DELETE | `/api/admin/products` | Admin | Product CRUD |
| GET/POST/PATCH/DELETE | `/api/admin/suppliers` | Admin | Supplier CRUD |
| POST | `/api/admin/suppliers/:id/coverage` | Admin | Add city/pincode |
| POST | `/api/samples` | — | Submit sample request |
| POST | `/api/samples/contact` | — | Submit contact form (emails admin) |

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Push to GitHub → Connect to Vercel
# Set VITE_API_URL and VITE_RAZORPAY_KEY_ID in Vercel env
```

### Backend + Database → Railway

```bash
# 1. In Railway: New Project → add a PostgreSQL plugin
# 2. New Service → Deploy from GitHub repo (backend)
# 3. Set all backend env variables in the Railway dashboard.
#    Reference the Postgres plugin's connection string for DATABASE_URL
#    (use the *.railway.internal host; append ?connection_limit=5&pool_timeout=20).
# 4. Railway runs `npm install` (postinstall → prisma generate) then `npm start`.
#    The start script runs `prisma migrate deploy` automatically before boot.
```

> **Connection pooling:** the backend uses a **single shared PrismaClient**
> (`src/lib/prisma.js`). Keep `connection_limit` small (≈5) in `DATABASE_URL`
> so it stays under the Postgres `max_connections` on small Railway plans.

### Scheduled payment reconciliation (Railway cron)

Add a **second Railway service** (or a cron schedule) that runs the reconcile
job every ~15 minutes as a backstop for any payment the webhook + verify paths
missed:

```
# Command:  npm run reconcile
# Schedule: */15 * * * *
```

It prints a `[RECONCILE ALERT]` line, emails the admin, and exits non-zero when
it finds paid-but-unrecorded orders, so the run shows up as failed/alerting.

### Database backup & disaster recovery

- **Railway automated backups:** enable on the Postgres plugin (requires a paid
  plan). This is the primary recovery mechanism — turn it on before launch.
- **Off-platform dumps:** run `npm run backup` (wraps `pg_dump -Fc`) on a daily
  schedule and copy the `backups/*.dump` files to external storage. Always take
  one immediately before any schema change.
- **Restore drill (do once before launch):**
  ```bash
  pg_restore --clean --no-owner -d "$TARGET_DATABASE_URL" backups/sugam-<ts>.dump
  ```
- **Payment-data recovery:** after any restore, run `npm run reconcile` to
  rebuild payment state from Razorpay (the source of truth).

> **Razorpay webhook:** in the Razorpay dashboard add a webhook pointing to
> `https://<your-backend>.up.railway.app/api/webhooks/razorpay` for the
> `payment.captured` and `order.paid` events, and set its secret as
> `RAZORPAY_WEBHOOK_SECRET`. This drives payment crash-recovery.

### Cloudinary Setup

1. Create a free Cloudinary account
2. Copy Cloud name / API Key / API Secret into the backend env (Railway dashboard for prod)
3. Uploaded images land in the `sugam/products` folder as WebP

---

## Email Notifications

Email is the only notification channel. Messages are sent via Nodemailer over
Gmail SMTP. Each event also writes an audit row via `recordNotification`.

| Event | Trigger | Recipient |
|-------|---------|-----------|
| Order confirmed | Payment success (verify-payment or webhook) | Customer |
| New order assigned | Order assigned to a supplier | Supplier |
| Order accepted | Supplier accepts | Customer |
| Order dispatched | Supplier dispatches | Customer |
| Order delivered | Supplier marks delivered | Customer |
| Contact form | Visitor submits contact form | Admin inbox |

> **Note:** Leave `GMAIL_USER` and `GMAIL_PASS` empty during development. All
> email calls are logged to the console (mock mode) instead of being sent.
> For production, use a Gmail **App Password** (not your account password).

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance (Mobile) | 90+ |
| Lighthouse Performance (Desktop) | 95+ |
| LCP | < 2.5s |
| CLS | < 0.1 |
| API Response Time (p95) | < 300ms |

---

## Out of Scope (v1)

- Mobile app
- Multi-language (Hindi, Gujarati)
- GST invoice generation
- TradeIndia API integration
- Inventory management
