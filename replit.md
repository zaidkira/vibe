# VIBE Restaurant Ordering App

A bold, playful restaurant ordering web app with a cashier view, live kitchen display, and admin panel. Built on a hot-pink candy-pastel aesthetic with dark backgrounds.

## Run & Operate

- `pnpm --filter @workspace/vibe run dev` — run the frontend (port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS, wouter routing, framer-motion animations
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/products.ts` — products table
- `lib/db/src/schema/orders.ts` — orders table (with JSONB items)
- `artifacts/vibe/src/pages/OrderPage.tsx` — cashier view with cart
- `artifacts/vibe/src/pages/KitchenPage.tsx` — kitchen display, polls every 10s
- `artifacts/vibe/src/pages/AdminPage.tsx` — admin with dashboard stats + product CRUD
- `artifacts/api-server/src/routes/products.ts` — products REST routes
- `artifacts/api-server/src/routes/orders.ts` — orders REST routes
- `artifacts/api-server/src/routes/dashboard.ts` — summary + top products routes
- `artifacts/vibe/public/vibe-logo.jpeg` — VIBE logo

## Architecture decisions

- Orders store items as JSONB in Postgres (snapshot of product name + price at order time) to avoid price drift
- Dashboard summaries computed in-memory from all orders (suitable for small-scale)
- Dark-first CSS theme in index.css (no separate dark mode needed)
- Kitchen page refetches orders every 10 seconds for live updates

## Product

- **Order Page (/)** — Cashier view: browse menu by category, add to cart, adjust quantities, place order
- **Kitchen Page (/kitchen)** — Live order feed with pending/done split, "Mark Done" button
- **Admin Page (/admin)** — Today's stats dashboard, top seller chart, full CRUD for menu products

## Brand

- Colors: Hot pink #FF3EA5, lime green #acef83, deep magenta #95285a
- Fonts: Notable (headings) + Archivo Black (body) via Google Fonts
- Tagline: "Turn the everyday into ritual."

## User preferences

- No login required — all 3 views accessible from navbar
- Bold, playful, gender-fluid aesthetic

## Gotchas

- Orders items are stored as JSONB — Drizzle returns them directly as JS objects
- `numeric` fields from Postgres come back as strings — always `Number(price)` when serializing
- Google Fonts `@import` must be the very first line in index.css (before tailwind imports)
