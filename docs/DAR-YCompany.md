# Retail Inventory Management Software System (RIMSS)

## YCompany — Design Architecture Recommendation (DAR)

**Prepared by:** Pawan Gupta — Nagarro Software Pvt. Ltd.
**Document version:** 2.0
**Date:** 25 May 2026

---

## Revision History

| Version | Date         | Author / Contributor | Comments                                                                                                       |
| ------- | ------------ | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1.0     | 23 Jul 2024  | Pawan Gupta          | Initial version (legacy React + Spring Boot + MySQL recommendation).                                           |
| 2.0     | 25 May 2026  | Pawan Gupta          | Re-baselined to reflect the as-built Next.js 16 / TypeScript implementation, Stripe, NextAuth and observability stack. |

---

## Contents

1. Introduction
2. Requirements at a Glance
3. Available Tools
4. Comparison Analysis
5. Recommendation (as implemented)
6. Architecture and Workflows
7. Continuous Support and Maintenance
8. Risks
9. Appendix

---

## 1. Introduction

YCompany stands as a leading luxury countryside fashion brand, celebrated for its distinctive collections of high‑quality clothing, shoes and accessories. Renowned for sweaters, moleskin clothing, corduroy apparel and tattersall shirts, YCompany has successfully evolved its product line to appeal to both traditional countryside customers and a younger, modern audience. This strategic diversification has reinforced its market presence and broadened its appeal. Despite this success, YCompany faced significant challenges with its previous online shopping infrastructure.

### 1.1 Problem Statement

The legacy YCompany storefront was constrained by several key issues that hindered a seamless online shopping experience:

- **Lack of cross‑platform support** — inconsistent user experience across devices and screen sizes.
- **High initial load time** — first contentful paint regularly exceeded one minute on retail Wi‑Fi.
- **Unresponsive UI** — UI lag and freezing during browsing and checkout.
- **Inefficient product search** — slow text search with no filtering or relevance ranking.
- **No inventory awareness in the storefront** — customers could add out‑of‑stock items to the cart.

These issues collectively impacted YCompany's ability to capture online sales and meet the expectations of modern consumers. In response, YCompany commissioned the Retail Inventory Management Software System (**RIMSS**) — a unified storefront and inventory experience built on a modern web stack.

### 1.2 Objective and Scope of Document

#### Objective

The primary objective of this document is to outline the high‑level design and the as‑implemented technical architecture of the RIMSS application for YCompany. It serves as a single reference for solution design, technology choices, non‑functional requirements, deployment topology and supported workflows.

Key objectives:

- **Address existing challenges** — cross‑platform support, initial load time, UI responsiveness and search efficiency.
- **Enhance user experience** — a seamless, responsive and intuitive online shopping flow.
- **Improve performance** — fast first paint, smooth interactions and instant filtering.
- **Ensure scalability and reliability** — stateless web tier deployable on Vercel and Kubernetes.
- **Add inventory awareness (RMS)** — per‑SKU stock surfaced in the storefront and enforced at the cart.

#### Scope

- **Solution overview** — high‑level description of features and capabilities.
- **Technical design** — App Router architecture, data flow, integration points (Stripe, NextAuth, observability).
- **Non‑functional requirements** — performance, security, accessibility, observability.
- **Assumptions and constraints** — including the demo data layer that will be replaced by Postgres.
- **Scope of work** — clear delineation of what is in repository vs. recommended follow‑ups.

---

## 2. Requirements at a Glance

### 2.1 Functional Requirements

- **User Management**
  - **Registration and authentication** — NextAuth v5 with **Credentials** plus optional **OAuth** (Google, GitHub, Facebook, Apple). Sessions are JWT‑backed with a 7‑day lifetime.
  - **User profile / account dashboard** — order history, account details and sign‑out (`/account`).
- **Product Management**
  - **Product catalog** — name, description, image, price, brand, category, tags, SKU and stock.
  - **Search and filtering** — server‑side `/api/products/search` (rate‑limited) and instant client filtering by query, brand, price range and sort.
  - **PDP (product detail page)** — `/products/[slug]` with related‑product cross‑sell and inventory state.
- **Cart and Checkout**
  - **Cart** — React Context backed by `localStorage`, with `clampAddQuantity()` to respect per‑SKU stock.
  - **Checkout** — Stripe Checkout Session via `/api/checkout`, with coupon discounts and shipping options.
- **Order Management**
  - **Order creation** — created on `checkout.session.completed` Stripe webhook (and via `/api/orders/sync` fallback when webhooks are not configured).
  - **Order history** — `/account` lists orders for the signed‑in user.
  - **Order detail and cancellation** — `/api/orders/[id]` and `/api/orders/[id]/cancel` (only while `status === "processing"`).
- **Discounts and Promotions**
  - **Coupon engine** — server‑validated coupons in `src/lib/coupons.ts` (`WELCOME10`, `SAVE20`, `FREESHIP`) exposed through `/api/coupons/validate` and mirrored into Stripe at session creation.
- **Customer Support**
  - Footer contact link, support email and observability hooks for proactive issue detection.

### 2.2 Non‑Functional Requirements

- **Performance**
  - First contentful paint target **under 3 seconds** on 4G. Achieved with `next/image`, MUI package import optimization (`optimizePackageImports`), route‑level `loading.tsx`, dynamic imports of the search UI and `compress: true` in `next.config.ts`.
  - Search API responds with `Cache-Control: public, max-age=30, stale-while-revalidate=60`.
- **Scalability** — Stateless web tier (Vercel serverless or Kubernetes `Deployment` with `replicas: 2`); horizontal scaling on traffic.
- **Usability** — Fully responsive Material UI 9 layouts; mobile cart cards, collapsible filters, drawer navigation; semantic markup.
- **Security**
  - Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
  - All API inputs validated with **Zod**.
  - Stripe webhook signature verification.
  - In‑memory **rate limiting** (`src/lib/rate-limit.ts`) on `/api/checkout` and `/api/products/search`.
  - Passwords hashed with **bcryptjs**; demo password hash is provisioned through `AUTH_DEMO_PASSWORD_HASH`.
  - `middleware.ts` protects `/account` routes with a redirect to `/login`.
- **Reliability** — Kubernetes readiness/liveness probes on `/`; Sentry captures unhandled exceptions client and server side.
- **Maintainability** — Strict TypeScript, ESLint (`eslint-config-next`), Vitest with 90 % line / function and 85 % branch coverage thresholds enforced in CI.

### 2.3 Assumptions

- **Technology stack** — Next.js 16 App Router with React 19 and TypeScript 5.
- **Third‑party services** — Stripe, NextAuth providers, Sentry, Google Analytics 4 and New Relic are integrated as **no‑ops** when their environment variables are not configured, allowing local development without credentials.
- **User base** — both existing customers and new visitors, on desktop and mobile.

### 2.4 Constraints

- **Budget and time** — must adhere to YCompany's defined release timeline.
- **Legacy integration** — orders persisted to a JSON store (`data/orders.json`) for demo; production database migration is identified as a follow‑up.
- **Image source** — product imagery currently served from `images.unsplash.com` (allow‑listed in `next.config.ts`); production assets should be replaced with brand‑owned CDN URLs.

---

## 3. Available Tools

### 3.1 Development Tools

- **Programming languages**
  - **TypeScript 5** — strict mode across the codebase.
  - **JavaScript (ES2022+)** — for build / config files only.
- **Frameworks and libraries**
  - **Next.js 16.2.3** — App Router, Server Components, Route Handlers, `middleware`, `metadata`, `sitemap.ts`, `robots.ts`, `manifest.ts`, **standalone** output.
  - **React 19** — Server Components, `useTransition`, `useDeferredValue`.
  - **Material UI 9** (`@mui/material`, `@mui/icons-material`, `@mui/material-nextjs`) with **Emotion 11** for SSR‑safe styling.
  - **TanStack Query 5** — client‑side data fetching, mutations and caching.
  - **Zod 4** — runtime schema validation for every API route.
  - **NextAuth 5 (beta)** — authentication and sessions.
  - **Stripe 22** — server SDK for Checkout Sessions, Coupons and Webhooks.
  - **bcryptjs** — password hashing for the Credentials provider.
- **Development environment**
  - **Visual Studio Code / Cursor** with TypeScript, ESLint and Vitest extensions.
- **Version control**
  - **Git** + **GitHub** (PR‑based workflow, Vercel preview deployments).
- **Build and tooling**
  - **Webpack** dev server (`next dev --webpack` — required for NextAuth routes in Next.js 16).
  - **Babel / SWC** — automatic via Next.js.
  - **Docker** — multi‑stage `Dockerfile` producing a Node 22 Alpine image from `.next/standalone`.

### 3.2 Testing Tools

- **Vitest 4** — unit and component test runner (Jest‑compatible API, native ESM, ~10× faster than Jest in this repo).
- **React Testing Library 16** + **@testing-library/jest-dom** + **@testing-library/user-event** — user‑centric component tests.
- **jsdom 29** — browser environment for component tests.
- **@vitest/coverage-v8** — V8 coverage with thresholds (`lines: 90, functions: 90, branches: 85, statements: 90`).

### 3.3 Collaboration and Project Management

- **JIRA** — backlog, sprint planning, defect triage.
- **Microsoft Teams** — daily standups, design syncs.
- **GitHub Pull Requests** — code review, CI checks, release notes.

### 3.4 Deployment and Hosting

- **Vercel** — primary hosting target with `vercel.json`, preview deployments per PR.
- **Docker** — `node:22-alpine` standalone runtime image.
- **Kubernetes** — `k8s/` manifests (`Deployment`, `Service`, `ConfigMap`, `Secret`) for portable hosting.
- **GitHub Actions** — recommended pipeline for `lint → test:ci → build → deploy` (Vercel CLI or `kubectl apply`).

### 3.5 Database and Storage

- **JSON store** (current) — `data/orders.json` plus seed module (`src/lib/orders/seed.ts`) for the demo experience; cached in `globalThis.__ycompanyOrders` between requests.
- **PostgreSQL** (recommended) — relational store for products, users and orders; introduced via Prisma or Drizzle in the next phase.
- **Object storage / CDN** — currently `images.unsplash.com`; production should move to an asset CDN such as Cloudflare R2 or Vercel Blob.

### 3.6 Monitoring and Analytics

- **Sentry** (`@sentry/nextjs` 10) — errors, performance traces and session replay; initialized in `src/lib/observability/sentry-client.ts` and wrapped via `withSentryConfig`.
- **Google Analytics 4** — `<GoogleAnalyticsProvider />` injects `gtag.js` only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set. Custom events: `add_to_cart`, `remove_from_cart`, `begin_checkout`, `purchase`, `search`, `login`, `view_item`, `apply_coupon`, `cancel_order`.
- **New Relic** (`newrelic` 14) — APM agent preloaded via `NODE_OPTIONS='-r newrelic'` (npm script `start:monitored`) or when `NEW_RELIC_LICENSE_KEY` is set on the container.

---

## 4. Comparison Analysis

The following analyses validate the technology choices that shipped in the YCompany implementation.

### 4.1 Frameworks and Libraries — Next.js (App Router) vs. plain React + Express

| Criterion        | Next.js 16 (App Router)                                                                       | React 19 + Express                                                          |
| ---------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Performance      | Server Components, automatic code splitting, RSC streaming, Image optimization                | Manual code splitting; bundle bloat unless heavily tuned                    |
| Scalability      | Edge / serverless out of the box on Vercel; standalone build for K8s                          | Requires bespoke Node tier and CDN                                          |
| Ease of use      | Conventional file‑based routing, built‑in API routes, ESLint preset                           | Stitching together React + router + bundler + server                        |
| Cost             | OSS; managed hosting tiers available                                                          | OSS, but operational cost is higher                                         |
| Suitability      | ✅ E‑commerce with mixed SSR/CSR/static                                                       | ❌ Higher TCO for SEO‑sensitive pages                                       |

**Recommendation:** **Next.js (App Router)** — selected and implemented.

### 4.2 UI Library — Material UI 9 vs. Tailwind + Headless UI

| Criterion        | Material UI 9                                                                                 | Tailwind + Headless UI                                                      |
| ---------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Velocity         | Pre‑built accessible components, theming, SSR cache provider                                  | Faster CSS authoring, but components must be assembled                      |
| Accessibility    | ARIA primitives baked in                                                                      | Quality depends on author                                                   |
| Theming          | `ThemeProvider` with palette/typography tokens                                                | Tailwind tokens, fully bespoke                                              |
| Suitability      | ✅ Rich e‑commerce widgets needed quickly                                                     | ✅ For design‑system heavy products                                         |

**Recommendation:** **Material UI 9** — chosen for accessibility and component breadth.

### 4.3 Testing Tools — Vitest vs. Jest

| Criterion        | Vitest 4                                                                                       | Jest                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Performance      | Native ESM, parallel workers, instant HMR for tests                                            | CommonJS by default; ESM support requires transformers                      |
| TS / Vite        | First‑class Vite + TS integration                                                              | Needs `ts-jest` or `@swc/jest`                                              |
| Features         | Built‑in coverage (V8), snapshot, mock, watch                                                  | Mature ecosystem, more plugins                                              |
| Suitability      | ✅ Aligns with Vite/Next 16 toolchain                                                          | ❌ Higher config cost on this project                                       |

**Recommendation:** **Vitest** — implemented in `vitest.config.ts` with `jsdom`, RTL setup and coverage thresholds.

### 4.4 Cloud Services — Vercel vs. AWS (ECS / Fargate)

| Criterion        | Vercel                                                                                         | AWS (ECS + ALB + CloudFront)                                                |
| ---------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Setup            | One‑click import, automatic preview URLs                                                       | IaC, IAM, VPC, ALB, CloudFront, Route 53 wiring                             |
| Next.js fit      | Native; Image Optimization, ISR, Edge functions                                                | Requires custom server / OpenNext or Amplify Hosting                        |
| Scalability      | Serverless autoscaling                                                                         | Mature horizontal scaling                                                   |
| Cost             | Free tier → usage based                                                                        | Always‑on baseline cost                                                     |

**Recommendation:** **Vercel** for the primary deployment; Docker + Kubernetes manifests retained for enterprise / on‑prem portability.

### 4.5 Authentication — NextAuth (Auth.js) vs. Custom JWT

| Criterion        | NextAuth v5                                                                                    | Custom JWT                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Providers        | Credentials + 50+ OAuth providers                                                              | DIY                                                                         |
| Sessions         | JWT or DB sessions, CSRF + cookie hardening                                                    | Build it yourself                                                           |
| Edge support     | Works with Next.js middleware                                                                  | Manual                                                                      |
| Suitability      | ✅ Faster, safer, less code                                                                    | ❌ More attack surface                                                       |

**Recommendation:** **NextAuth v5** (Credentials + OAuth: Google, GitHub, Facebook, Apple) — implemented.

### 4.6 Payments — Stripe Checkout vs. PayPal Standard

| Criterion        | Stripe Checkout                                                                                | PayPal Standard                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Developer UX     | First‑class TypeScript SDK, hosted Checkout, granular webhooks                                 | Mature but older SDK ergonomics                                             |
| Features         | Coupons, Apple Pay, Google Pay, Subscriptions, Tax                                             | Coupons via separate flow                                                    |
| Fraud / 3DS      | Stripe Radar, automatic 3DS                                                                    | Requires add‑ons                                                            |
| Suitability      | ✅ Best fit for a modern apparel storefront                                                    | ❌                                                                          |

**Recommendation:** **Stripe Checkout** — implemented with hosted UI, coupons and a signed webhook handler.

### 4.7 Database — PostgreSQL vs. MongoDB

| Criterion        | PostgreSQL                                                                                     | MongoDB                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Data model       | Strong relational fit for products, orders, lines, users                                       | Document model, flexible schema                                             |
| Querying         | Mature SQL, joins, transactions, JSONB for flexible fields                                     | Aggregation pipeline                                                        |
| Ops              | Widely supported managed services (RDS, Supabase, Neon, Aurora)                                | Atlas managed service                                                       |
| Suitability      | ✅ Recommended next step (Prisma or Drizzle)                                                   | ❌ Over‑flexible for this domain                                            |

**Recommendation:** **PostgreSQL** — to be introduced when migrating off the JSON demo store.

### 4.8 Observability — Sentry + GA4 + New Relic vs. single‑vendor APM

| Criterion        | Sentry + GA4 + New Relic (implemented)                                                         | Single‑vendor APM                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Errors           | Sentry (replay, source maps, releases)                                                         | Less depth                                                                   |
| Web analytics    | GA4 (commerce events)                                                                          | Limited                                                                      |
| APM              | New Relic agent on the server                                                                  | Strong                                                                       |
| Cost             | Free tiers for each                                                                            | One bill                                                                     |

**Recommendation:** Specialised stack (**Sentry + GA4 + New Relic**) for full‑funnel visibility.

---

## 5. Recommendation (as implemented)

Based on the analyses above, the YCompany RIMSS application has been built and is recommended for production with the following stack:

### Frontend

- **Next.js 16 (App Router)** with **React 19** and **TypeScript 5**.
- **Material UI 9** + **Emotion** (`AppRouterCacheProvider` for SSR style hydration).
- **TanStack Query 5** for client‑side mutations and cached server data.
- Built‑in optimizations: `next/image`, `optimizePackageImports`, dynamic imports, route‑level `loading.tsx`, server‑rendered metadata, sitemap and manifest.

### Backend (Route Handlers)

- **Next.js Route Handlers** under `src/app/api/`:
  - `POST /api/checkout` — creates a Stripe Checkout Session (with optional coupon and free‑shipping rules).
  - `POST /api/webhooks/stripe` — verifies signatures and persists paid orders.
  - `POST /api/orders/sync` — manual reconciliation when webhooks are not yet configured.
  - `GET /api/orders` and `GET /api/orders/[id]`, `POST /api/orders/[id]/cancel` — authenticated order operations.
  - `GET /api/products/search` — rate‑limited catalog search with cache headers.
  - `POST /api/coupons/validate` — server validation for promo codes.
  - `GET/POST /api/auth/[...nextauth]` — NextAuth v5 endpoints.
- **Zod** validates every request payload; **rate limiting** protects search and checkout.

### Authentication

- **NextAuth v5** with **Credentials** (bcrypt‑hashed demo user) and optional **OAuth** providers (Google, GitHub, Facebook, Apple). JWT session strategy, 7‑day TTL.
- `middleware.ts` enforces the `/account` route group.

### Payments

- **Stripe Checkout (hosted)** with shipping options for US / CA / GB.
- Promotion codes mirrored into Stripe via `stripe.coupons.create()` per session.
- **Signed webhooks** at `/api/webhooks/stripe` create orders idempotently from `checkout.session.completed`.

### Data layer (current → recommended)

- **Current:** in‑memory cache with JSON persistence (`data/orders.json`). Suitable for demo and CI.
- **Recommended next step:** **PostgreSQL** via **Prisma** (or **Drizzle**) for products, users and orders. Mirror coupons to Stripe Promotion Codes.

### Observability

- **Sentry** for errors, traces and session replay (client and server).
- **Google Analytics 4** for funnel and commerce analytics (`add_to_cart`, `begin_checkout`, `purchase`, `search`, `apply_coupon`, etc.).
- **New Relic** APM agent for server‑side performance metrics.

### Deployment

- **Vercel** as the primary target (`vercel.json`, `iad1` region, security headers).
- **Docker** (`node:22-alpine`, standalone Next.js output) for portable runtimes.
- **Kubernetes** manifests (`Deployment` with `replicas: 2`, `Service`, `ConfigMap`, `Secret`, readiness / liveness probes) for enterprise hosting.

### Quality gates

- **Vitest** for unit/component tests with V8 coverage thresholds (`lines/functions ≥ 90 %`, `branches ≥ 85 %`).
- **ESLint** (`eslint-config-next`, TypeScript rules) enforced in CI.
- **TypeScript strict** mode across the repository.

---

## 6. Architecture and Workflows

### 6.1 System Architecture (high level)

```text
                                  Customer browser
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │   Vercel Edge / CDN  │  ◄── security headers, image optimization
                              └──────────┬───────────┘
                                         │
                                         ▼
        ┌──────────────────────────────────────────────────────────────┐
        │                Next.js 16 (App Router) – React 19            │
        │                                                              │
        │  Server Components       Route Handlers        middleware.ts │
        │  ┌─────────────────┐   ┌─────────────────┐   ┌────────────┐  │
        │  │ Home / PDP /    │   │ /api/checkout    │  │  Auth      │  │
        │  │ Search / Cart / │   │ /api/orders/*    │  │  guard     │  │
        │  │ Account pages   │   │ /api/products/.. │  │  /account  │  │
        │  └────────┬────────┘   │ /api/coupons/..  │  └────────────┘  │
        │           │            │ /api/webhooks/.. │                  │
        │           ▼            └────────┬─────────┘                  │
        │      ┌─────────────┐            │                            │
        │      │ MUI Theme + │            ▼                            │
        │      │ TanStack Q. │      ┌─────────────────────┐            │
        │      │ + Zod       │      │ services: orders,   │            │
        │      └─────────────┘      │ coupons, search,    │            │
        │                           │ inventory, stripe   │            │
        │                           └─────────┬───────────┘            │
        └─────────────────────────────────────┼──────────────────────-─┘
                                              │
       ┌──────────────────────────────────────┼────────────────────────────────────┐
       │                                      │                                    │
       ▼                                      ▼                                    ▼
┌─────────────┐                  ┌──────────────────────┐                ┌─────────────────────────┐
│ NextAuth v5 │                  │ Stripe API           │                │ Persistence              │
│ Credentials │                  │  • Checkout Sessions │                │  • JSON store (demo)     │
│ + OAuth     │                  │  • Coupons           │                │  • PostgreSQL (next)     │
│ (Google,    │                  │  • Webhooks (signed) │                └─────────────────────────┘
│  GitHub,    │                  └──────────┬───────────┘
│  Facebook,  │                             │
│  Apple)     │                             │  checkout.session.completed
└─────────────┘                             ▼
                                  ┌──────────────────────┐
                                  │  Order created in    │
                                  │  RIMSS (idempotent)  │
                                  └──────────────────────┘

      Cross‑cutting: Sentry (errors + replay) · GA4 (commerce events) · New Relic APM (server)
```

### 6.2 Module Map (`src/`)

```text
src/
├── app/                      App Router (pages + Route Handlers)
│   ├── (storefront)          home, products, search, cart, checkout, account, login
│   └── api/                  checkout, coupons, orders (+ sync, [id], cancel),
│                             products/search, webhooks/stripe, auth/[...nextauth]
├── components/               UI primitives, ProductCard, Header/Footer,
│                             CouponField, AccountDashboard, observability/*
├── context/CartContext.tsx   localStorage‑backed cart with inventory clamping
├── data/products.ts          demo catalog (replaceable by Postgres)
├── hooks/api/                useApiQuery / useApiMutation / useCheckout /
│                             useOrders / useSyncOrder (TanStack Query)
├── i18n/                     dictionary, server + client helpers, en.json
├── lib/
│   ├── api/                  ApiError, query‑keys, shared types
│   ├── auth-providers.ts     NextAuth provider builder (Credentials + OAuth)
│   ├── coupons.ts            server‑side coupon rules + tests
│   ├── env.ts                schema‑validated env vars and request bodies
│   ├── inventory.ts          stock clamping helpers
│   ├── observability/        sentry-client, analytics (GA4), errors
│   ├── orders/               store (JSON), service (CRUD), seed (demo)
│   ├── product-filters.ts    URL ↔ filter mapping, sort helpers
│   ├── product-image.ts      catalog imagery resolution
│   ├── rate-limit.ts         in‑memory bucket rate limiter
│   ├── search-index.ts       indexed catalog search
│   └── stripe.ts             lazy Stripe SDK client
├── middleware.ts             NextAuth‑aware route protection
├── providers/QueryProvider   TanStack Query client provider
├── theme/                    MUI theme + form field styles
└── types/                    Product, Order, NextAuth augmentation
```

### 6.3 Checkout Workflow (end‑to‑end)

```text
Customer            Browser                Next.js App                Stripe                  Observability
   │                  │                         │                       │                        │
   │ Browse products  │                         │                       │                        │
   │ ───────────────► │ Server Component HTML   │                       │                        │
   │                  │ ◄──────────────────────│                       │                        │
   │ Add to cart      │ CartContext (localStg)  │                       │ trackAddToCart (GA4)   │
   │ ───────────────► │ + inventory clamp       │                       │ ─────────────────────► │
   │                  │                         │                       │                        │
   │ Apply coupon     │ CouponField             │ POST /api/coupons/   │                        │
   │ ───────────────► │ ──────────────────────► │  validate (Zod)       │                        │
   │                  │                         │ ◄──── valid?          │ trackApplyCoupon (GA4) │
   │                  │                         │                       │ ─────────────────────► │
   │ Click "Checkout" │                         │ POST /api/checkout    │                        │
   │ ───────────────► │ useCheckout mutation    │ ───────────────────► │ stripe.checkout         │
   │                  │                         │                       │  .sessions.create()    │
   │                  │                         │                       │ ◄── session.url        │
   │                  │ window.location = url   │                       │                        │
   │ ─────────────────┴──────────────────────────────────────────────► │ Stripe‑hosted Checkout │
   │                                                                    │                        │
   │                                            ┌─ webhook ───────────┘                        │
   │                                            │  POST /api/webhooks/stripe (signed)            │
   │                                            ▼                                                │
   │                                  ordersService.createOrderFromCheckout()                    │
   │                                  (idempotent on stripeSessionId)                            │
   │                                                                                             │
   │ Redirect to /checkout/success?session_id=...                                                │
   │ ◄────────────── useSyncOrder fallback ─────► POST /api/orders/sync (if no webhook)          │
   │                                                                                             │
   │ trackPurchase (GA4) ─────────────────────────────────────────────────────────────────────► │
```

### 6.4 Authentication Workflow

```text
Visitor → /login page (LoginView)
             │
             ├── Credentials (email + password)
             │       └─► NextAuth `authorize()` → bcrypt.compare → JWT (7d)
             │
             └── OAuth button (Google / GitHub / Facebook / Apple, only when env vars set)
                     └─► NextAuth OAuth flow → callback `/api/auth/callback/<provider>`
                             └─► jwt() / session() callbacks populate session.user

Authenticated request to /account
   middleware.ts → auth() → req.auth ? next() : redirect("/login?callbackUrl=...")
```

### 6.5 Search Workflow

```text
User types in /search
   │
   ▼
SearchClient (use-debounce 200 ms)
   │
   ├── URL sync (router.replace) — keeps deep links shareable
   │
   ▼
GET /api/products/search?q=&brands=&min=&max=&sort=
   │
   ├── rateLimit("search:" + ip, 120 / 60s)
   ├── parseFiltersFromSearchParams() — Zod‑validated
   ▼
searchCatalog(products, filters)   ◄── cached CatalogIndex with brand counts
   │
   ▼
{ products, total, tookMs }   (Cache-Control: max-age=30, SWR=60)
```

### 6.6 Order Lifecycle

```text
processing  ──(webhook checkout.session.completed)──► created in store
     │
     ├── cancellable while status === "processing"
     │     └─► POST /api/orders/[id]/cancel  (auth‑guarded; user‑owned)
     │           └─► status = "cancelled", cancelledAt = now()
     │
     ├── shipped     (warehouse update — out of repo)
     └── delivered   (carrier update — out of repo)
```

### 6.7 Deployment Topology

```text
                ┌────────────── Vercel (primary) ───────────────┐
GitHub PR ───►  │  • Preview deployment per PR                  │
                │  • Edge CDN, automatic HTTPS                  │
                │  • Serverless Functions for Route Handlers    │
                │  • iad1 region; security headers in vercel.json│
                └────────────────────────────────────────────────┘

                       ┌────────── Kubernetes (portable) ─────────┐
docker build ──►       │  Deployment (replicas: 2)                │
                       │   └─ container ycompany‑web              │
                       │       env from ConfigMap + Secret        │
                       │       readiness/liveness on GET /        │
                       │  Service (ClusterIP) → Ingress (TLS)     │
                       └──────────────────────────────────────────┘
```

---

## 7. Continuous Support and Maintenance

### 7.1 Support Structure

- **Help‑desk support** — dedicated queue for customer issues during business hours.
- **Technical support** — engineering on‑call for production incidents, surfaced through Sentry alerts and New Relic dashboards.
- **Escalation procedures** — P1 (site outage) → on‑call lead within 15 min; P2 → next business day; P3 → backlog.

### 7.2 Maintenance Activities

- **Regular updates** — monthly dependency review (Next.js, React, NextAuth, Stripe SDK, MUI); patch releases applied within the sprint.
- **Bug fixes** — tracked in JIRA, fixed via PRs that include Vitest coverage and Sentry release association.
- **Performance monitoring** — Vercel Analytics, New Relic dashboards and GA4 funnels reviewed weekly.
- **Backup and recovery** — once PostgreSQL is introduced, nightly automated snapshots with 7‑day retention.
- **Security patches** — GitHub Dependabot and weekly `npm audit`; security headers reviewed each release.

### 7.3 User Training and Documentation

- **User training** — onboarding guide for retail staff using the cancellation and order views; refreshed each release.
- **Technical documentation** — `README.md`, `PLAN.md`, `docs/DEPLOY-VERCEL.md`, this DAR, and inline JSDoc.

### 7.4 Feedback and Improvement

- **User feedback** — collected via the support form and GA4 events; reviewed in monthly product reviews.
- **Continuous improvement** — every sprint allocates capacity for performance budgets, A11y audits and tech‑debt items.

### 7.5 Service Level Agreements (SLAs)

| Severity | Definition                                | Response | Resolution target |
| -------- | ----------------------------------------- | -------- | ----------------- |
| P1       | Site down or checkout broken              | 15 min   | 4 hours           |
| P2       | Major feature degraded                    | 1 hour   | 1 business day    |
| P3       | Minor defect, no workaround needed        | 1 day    | Next sprint       |
| P4       | Cosmetic / enhancement                    | 3 days   | Backlog           |

---

## 8. Risks

### 8.1 Technical Risks

- **Integration challenges** — Stripe / NextAuth provider misconfiguration.
  _Mitigation:_ environment validation in `src/lib/env.ts`, integration tests in CI, graceful "no‑op" behaviour when credentials are absent.
- **System performance** — server‑rendered pages slow under spikes.
  _Mitigation:_ MUI package import optimization, `next/image`, route‑level `loading.tsx`, search response caching (`Cache-Control: max-age=30, SWR=60`), Vercel autoscaling and Kubernetes HPA.
- **Security vulnerabilities** — third‑party CVEs, prompt injection on inputs.
  _Mitigation:_ Zod validation on every input, signed Stripe webhooks, security headers, in‑memory rate limiter (planned upgrade to Upstash Redis), Dependabot.

### 8.2 Project Management Risks

- **Scope creep** — change‑control via JIRA backlog grooming and pull‑request templates.
- **Resource availability** — paired ownership of critical modules (auth, payments).
- **Timeline delays** — release trains with explicit "ready for QA" criteria.

### 8.3 Business Risks

- **User adoption** — A/B testing on key surfaces, GA4 funnel review.
- **Cost overruns** — Vercel usage alerts and per‑environment budgets.
- **Regulatory compliance** — GDPR / CCPA cookie banner and data export endpoints planned ahead of EU launch.

### 8.4 Operational Risks

- **Data migration** (JSON → PostgreSQL) — dual‑write window with reconciliation script.
- **System downtime** — Kubernetes rolling deploys and Vercel atomic deploys.
- **Vendor reliability** — Stripe and NextAuth providers are status‑monitored; fallbacks exist for analytics outages.

---

## 9. Appendix

### 9.1 Glossary of Terms

- **RIMSS** — Retail Inventory Management Software System; the YCompany storefront with inventory awareness.
- **RSC** — React Server Components; rendered on the server, no JavaScript shipped for the component itself.
- **App Router** — Next.js 13+ routing model under `src/app/`, replaces the legacy `pages/` router.
- **Route Handler** — `route.ts` file exporting HTTP methods (`GET`, `POST`, …) inside `src/app/api/`.
- **JWT** — JSON Web Token; the session strategy used by NextAuth v5.
- **OAuth** — Open Authorization; protocol used by the Google / GitHub / Facebook / Apple providers.
- **Stripe Checkout** — Stripe‑hosted, PCI‑scoped payment page consumed via Checkout Sessions.
- **Webhook** — Signed asynchronous HTTP callback (`/api/webhooks/stripe`) that creates the order on payment.
- **SLA** — Service Level Agreement (see §7.5).

### 9.2 Relevant Documents

- `README.md` — setup, scripts, observability, deploy summary.
- `PLAN.md` — phased roadmap, problem‑to‑solution mapping, next steps.
- `docs/DEPLOY-VERCEL.md` — step‑by‑step Vercel deployment guide.
- `k8s/*.yaml` — Kubernetes manifests (`Deployment`, `Service`, `ConfigMap`, `Secret`).
- `Dockerfile` — multi‑stage build for the standalone Next.js runtime.
- `vitest.config.ts` — test runner and coverage thresholds.

### 9.3 Diagrams and Charts

| Diagram                  | Section |
| ------------------------ | ------- |
| System Architecture      | §6.1    |
| Module Map               | §6.2    |
| Checkout Workflow        | §6.3    |
| Authentication Workflow  | §6.4    |
| Search Workflow          | §6.5    |
| Order Lifecycle          | §6.6    |
| Deployment Topology      | §6.7    |

### 9.4 Contact Information

- **Lead Developer:** Pawan Gupta — pawan.gupta@nagarro.com — +91 98112 83937

### 9.5 Additional Resources

- **Training materials** — internal onboarding deck and Loom walk‑throughs of the checkout flow.
- **FAQs** — collated in `README.md` and `docs/DEPLOY-VERCEL.md` troubleshooting tables.
- **Support documentation** — runbooks for Sentry triage, Stripe webhook replay and New Relic dashboards.

This appendix consolidates the supporting material for the RIMSS implementation, ensuring that all relevant artefacts are readily accessible to stakeholders and engineering teams.
