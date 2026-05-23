# YCompany — E‑commerce roadmap

Brand: **YCompany** — luxury countryside fashion (sweaters, moleskin, corduroy, tattersall). Stack: **Next.js App Router**, **Material UI**, **NextAuth**, **Stripe**, **TanStack Query**, **Vitest**, **Docker**, **Kubernetes**, **Vercel**.

## Business objectives (problem statement → solution)

| Legacy issue | In-repo response |
|--------------|------------------|
| **Lack of cross-platform support** | Responsive MUI layouts (mobile cart cards, collapsible search filters, drawer nav), `viewport` + web `manifest`, touch-friendly controls |
| **High initial load time** | `next/image` on product cards, `optimizePackageImports` for MUI, route `loading.tsx`, dynamic import of search UI, `compress` + cache headers on search API |
| **Unresponsive UI** | Debounced search (no navigation per keystroke), `useDeferredValue` for results grid, memoized `ProductCard`, React Query for mutations |
| **Inefficient product search** | Indexed in-memory `searchCatalog`, `/api/products/search` for server-side scale, instant client filtering while typing |
| **Retail inventory (RMS)** | `stock` + `sku` on products, `src/lib/inventory.ts`, cart respects available quantity |

## Phases (what is in-repo vs next)

### Done in this repository (foundation)

| Area | Implementation |
|------|----------------|
| **UI** | Responsive MUI theme, `AppRouterCacheProvider`, header/footer, home, product listing, product detail, search, cart, checkout, login, account |
| **SEO** | `metadata` per route, Open Graph, `sitemap.ts`, `robots.ts`, semantic structure |
| **Search** | `/search?q=` debounced URL sync; indexed filter by name, material, category, tags; `GET /api/products/search` |
| **Inventory (RMS)** | Per-SKU `stock`, cart clamping, low/out-of-stock UI on cards and PDP |
| **Cart** | React context + `localStorage` persistence |
| **Stripe** | Checkout Session API (`/api/checkout`), webhook stub (`/api/webhooks/stripe`) with signature verification |
| **Coupons** | Server rules in `src/lib/coupons.ts`, validate via `/api/coupons/validate`; % off, fixed max, free shipping flag |
| **Security** | Security headers in `next.config.ts`, `middleware` for session refresh + protected `/account`, Zod on APIs, Stripe webhook verification, env validation |
| **Auth** | NextAuth v5 Credentials (demo user + env-driven hash) |
| **Tests** | Vitest + RTL; coupon logic + sample component test |
| **Observability** | Sentry (`global-error`, API `reportError`), GA4 (`@next/third-parties`), New Relic (`newrelic.js` + instrumentation) |
| **Deploy** | `Dockerfile` (standalone), `k8s/` manifests, `vercel.json` |

### Recommended next steps (production)

1. **Data** — Move products, users, orders to **PostgreSQL** (Prisma/Drizzle) or **Supabase**; replace mock catalog.
2. **Stripe** — Create **Products/Prices** in Stripe Dashboard or sync via API; use **Customer Portal** for subscriptions if needed; enable **Apple Pay / Google Pay** (Payment Request Button) in hosted Checkout.
3. **Coupons** — Mirror promotions in Stripe (Coupons/Promotion Codes) or sync validated codes before session creation.
4. **Auth** — Add **OAuth** (Google, Apple); optional **password reset** email; consider **MFA** for admin.
5. **Security** — **WAF** (Cloudflare), **CSRF** for non-API forms, **rate limiting** per IP (Redis/Upstash), **audit logs**, dependency scanning (Dependabot), **SAST** in CI.
6. **Observability** — Sentry (errors + replay), Google Analytics 4 (engagement), New Relic APM (server). See README observability table. Optional: OpenTelemetry export, structured log aggregation.
7. **K8s free tier** — Vercel is **not** Kubernetes; use **Oracle OKE free tier**, **Google GKE autopilot trial**, **Kind/Minikube** locally, or **Render/Fly.io** for simpler hosting. This repo’s manifests target a generic cluster with an `Ingress`.

## Feature checklist (full apparel store)

- Catalog, PDP, categories, size/color (extend product model),
- Inventory reservations, wishlist, reviews (moderated),
- Orders history, returns RMA, shipping tracking,
- Admin CMS (products, coupons, orders),
- Email transactional (order confirm, ship),
- GDPR/CCPA consent, cookie banner, privacy policy pages,
- **A11y** audits (axe), **i18n** if multi-region.

## Environment variables

See `.env.example` for `AUTH_SECRET`, Stripe keys, demo user hash, and site URL.
