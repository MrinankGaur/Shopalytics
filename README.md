# Shopalytics

A full-stack multi-tenant Shopify analytics dashboard.

- Backend: Node.js, Express, Prisma (PostgreSQL), Shopify API
- Frontend: Next.js App Router (React 19), TypeScript, Tailwind CSS, Recharts

## Features
- Email/password authentication with JWT (httpOnly cookies)
- Multi-tenant: link user accounts to multiple Shopify stores (tenants)
- Shopify OAuth install flow and webhooks (orders/create)
- Data sync for Products, Customers, Orders, and Line Items
- Dashboard with charts: revenue over time, segmentation, sales by hour, best sellers, top customers

## Monorepo Structure
- `backend/`: Express API + Prisma + Shopify integrations
- `frontend/`: Next.js dashboard UI

## Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL database
- Shopify Partner account and a custom app for OAuth

## Environment Variables
Create `.env` files in `backend/` and `frontend/`.

### Backend (`backend/.env`)
```
# Server
PORT=3000
NODE_ENV=development
HOST=http://localhost:3000
CORS_ORIGIN=http://localhost:3001

# Auth
JWT_SECRET=replace-with-a-long-random-string

# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public

# Shopify App
SHOPIFY_API_KEY=your_app_api_key
SHOPIFY_API_SECRET=your_app_api_secret
```

Notes:
- `HOST` must be the full URL of the backend reachable by Shopify (no protocol in shopify.config `hostName` after processing).
- The server currently enables CORS for `http://localhost:3001`.

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

## Installation
From the repo root, install dependencies for both apps:

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Database Setup (Prisma + PostgreSQL)
In `backend/`:

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy
# or during development
npx prisma migrate dev
```

The Prisma schema defines models: `User`, `Tenant`, `Customer`, `Product`, `Order`, `LineItem` with composite unique constraints to support multi-tenancy.

## Shopify App Configuration
Create a custom app in your Shopify Partner dashboard and configure the following:

- App URL: `http://localhost:3000`
- Allowed redirection URL(s): `http://localhost:3000/api/shopify/callback`
- Webhook subscriptions (Admin API 2024-07 or later):
  - `orders/create` → Delivery URL: `http://localhost:3000/api/shopify/webhooks/orders/create`
- Scopes: `read_products, read_orders, read_customers`

Store the app credentials in `backend/.env` as `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET`.

## Running Locally
Open two terminals.

### 1) Backend API (http://localhost:3000)
```bash
cd backend
npm run dev
```

Endpoints mounted in `server.js`:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/change-password` (auth required)
- `GET /api/tenants/me/data` (auth required)
- `POST /api/tenants/:tenantId/sync` (auth required)
- `POST /api/tenants/link` (auth required)
- `DELETE /api/tenants/:tenantId` (auth required)
- `GET /api/shopify/install?shop={shop-domain}`
- `GET /api/shopify/callback`
- `POST /api/shopify/webhooks/orders/create` (raw body webhook)
- `GET /health`

### 2) Frontend UI (http://localhost:3001)
```bash
cd frontend
npm run dev
```

Make sure `NEXT_PUBLIC_API_BASE_URL` points at the backend (default `http://localhost:3000`).

## Auth Flow (Summary)
1. User registers or logs in at the frontend; backend sets an httpOnly `token` cookie.
2. Protected routes use `authenticateToken` middleware to authorize requests.
3. A user can link to an existing `tenant` via `POST /api/tenants/link`.

## Shopify Install Flow (Summary)
1. Visit `GET /api/shopify/install?shop={your-shop.myshopify.com}`.
2. Shopify redirects back to `GET /api/shopify/callback` with a session.
3. The backend upserts a `Tenant` and stores `accessToken`, then redirects to the frontend at `/shopify/return` with `newTenantId` and `shop`.
4. You can then call sync endpoints or let webhooks trigger updates.

## Data Sync
- Webhooks: `orders/create` → validates webhook and triggers `syncOrders`.
- Manual: `POST /api/tenants/:tenantId/sync` → calls `syncProducts`, `syncCustomers`, `syncOrders`.

## Frontend Overview
- App routes under `frontend/app/dashboard/*`
- Charts in `frontend/components/*`
- API client in `frontend/lib/clientApiService.ts`

Set `NEXT_PUBLIC_API_BASE_URL` to ensure all client fetches target your API server.

## Production Notes
- Use HTTPS for both frontend and backend; set secure cookie flags accordingly.
- Configure CORS and `HOST` to public URLs.
- Run migrations on deploy (`prisma migrate deploy`).
- Provide persistent PostgreSQL and environment secrets.

## Scripts
### Backend
- `npm run dev` → start API with nodemon on port 3000
- `npm start` → start API with Node
- `npx prisma generate` → generate Prisma client
- `npx prisma migrate deploy` → apply migrations in production

### Frontend
- `npm run dev` → start Next.js dev server on port 3001
- `npm run build` → build
- `npm start` → start production server

## API Reference (Quick)
Auth
- `POST /api/auth/register` { email, password }
- `POST /api/auth/login` { email, password }
- `POST /api/auth/logout`
- `POST /api/auth/change-password` { oldPassword, newPassword } (auth)

Tenants (auth)
- `GET /api/tenants/me/data`
- `POST /api/tenants/:tenantId/sync`
- `POST /api/tenants/link` { tenantId }
- `DELETE /api/tenants/:tenantId`

Shopify
- `GET /api/shopify/install?shop={shop}`
- `GET /api/shopify/callback`
- `POST /api/shopify/webhooks/orders/create`

Health
- `GET /health`

## Troubleshooting
- 401 on protected routes: ensure login cookie is set; check `JWT_SECRET`.
- CORS issues: backend `cors` origin must match frontend origin.
- Shopify `hostName` error: ensure `HOST` is set and has protocol (http/https); the config strips it.
- Webhook validation failures: webhook must be sent to backend public URL and raw body must be used.

## License
MIT
