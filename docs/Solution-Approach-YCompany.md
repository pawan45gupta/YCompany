# RFP Response — Solution Approach

## YCompany — Retail Inventory Management Software System (RIMSS)

**Prepared for:** YCompany — Luxury Countryside Fashion
**Prepared by:** Pawan Gupta — Nagarro Software Pvt. Ltd.
**Document version:** 1.0
**Date:** 25 May 2026

---

## Revision History

| Version | Date         | Author / Contributor | Comments                                                                                                       |
| ------- | ------------ | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| 0.1     | 14 May 2026  | Pawan Gupta          | Initial draft of the Solution Approach for the YCompany RIMSS RFP response.                                    |
| 1.0     | 25 May 2026  | Pawan Gupta          | Reviewed and finalised; technology stack confirmed against the implemented reference solution.                 |

---

## Preface

This Solution Approach document is Nagarro's formal response to YCompany's Request for Proposal (RFP) for the **Retail Inventory Management Software System (RIMSS)**. It describes the end‑to‑end solution we propose to deliver — covering business context, solution architecture, technology stack, delivery methodology, quality assurance, security, DevOps, observability, governance, and risk management.

The proposal is grounded in a working reference implementation already built on the same stack (Next.js 16, React 19, TypeScript, Material UI 9, NextAuth v5, Stripe, Vitest, Docker, Kubernetes, Vercel, Sentry, Google Analytics 4 and New Relic). Every approach described here is therefore proven on running code, not aspirational — see the *YCompany — Design Architecture Recommendation (DAR)* document for the as‑built architecture.

---

## 1. Introduction

YCompany is a leading luxury countryside fashion brand with a distinctive portfolio — sweaters, moleskin clothing, corduroy apparel and tattersall shirts — that has successfully evolved to appeal to both traditional countryside customers and a younger, modern audience. Despite the brand's commercial strength, the existing online storefront falls short on cross‑platform support, performance, UI responsiveness and search efficiency, limiting online sales and customer satisfaction.

YCompany has therefore invited proposals for a new **Retail Inventory Management Software System (RIMSS)** — a unified, performant, mobile‑first storefront with end‑to‑end inventory awareness, secure payments, social login, observability and a clear runway to a production data platform.

### 1.1 Document Purpose

This document is the **Solution Approach** chapter of Nagarro's RFP response. It is intended to give YCompany's evaluation panel a clear, technical and methodological view of:

- What we will build (solution overview, scope, architecture).
- How we will build it (delivery methodology, team, governance, ceremonies).
- How we will assure quality (testing strategy, coverage targets, code review).
- How we will operate it (CI/CD, deployment topology, observability, incident response).
- How we will manage risk (technical, project, business and operational risks).

### 1.2 Document Scope

In scope of this Solution Approach:

- High‑level and detailed solution architecture for the storefront, APIs, auth, payments, inventory and observability.
- Technology stack with rationale.
- Delivery methodology (Agile / Scrum), team composition and governance.
- Quality, security and compliance approach.
- DevOps approach including environments, CI/CD pipeline and release management.
- Risk and assumption register.

Out of scope of this document (covered separately):

- Commercial proposal, effort estimates and pricing — see the companion **Estimates** workbook.
- Detailed test cases and test data — see the **Test Plan** to be produced in Sprint 0.
- Statement of Work and contractual terms — captured in the SOW document.

### 1.3 Audience

| Audience                              | What they will find useful                                          |
| ------------------------------------- | ------------------------------------------------------------------- |
| YCompany business sponsors            | Sections 1, 2, 3 (intent, scope, solution overview)                  |
| YCompany IT / architecture reviewers  | Sections 4, 5, 7, 8 (architecture, tech stack, security, DevOps)     |
| YCompany delivery / PMO               | Sections 6, 11, 12, 13 (delivery, governance, risks, assumptions)    |
| Nagarro delivery team                 | Entire document plus the DAR for as‑built design details             |

---

## 2. Problem Statement and Goals

### 2.1 Pain points in the current state

The legacy YCompany storefront suffers from the following well‑documented issues:

- **Lack of cross‑platform support** — the experience is not consistent across devices and viewport sizes; mobile checkout drop‑off is unusually high.
- **High initial load time** — first contentful paint frequently exceeds one minute on retail Wi‑Fi, driving bounce rates up.
- **Unresponsive UI** — janky scrolling, freezing forms and slow interaction feedback degrade the brand experience.
- **Inefficient product search** — search is slow, with no relevance ranking or filtering, frustrating customers looking for specific lines such as moleskin, corduroy or tattersall.
- **No inventory awareness in the storefront** — customers can add out‑of‑stock items to the cart and are only told at checkout.
- **No unified observability** — incidents are detected by customer complaints rather than telemetry.

### 2.2 Business goals

YCompany's strategic outcomes for the new platform are:

- **Lift online conversion** by delivering a fast, mobile‑first storefront with sub‑3‑second first contentful paint on 4G.
- **Protect brand experience** with a consistent, accessible, modern UI across all viewports.
- **Reduce post‑purchase issues** by surfacing inventory in real time and preventing out‑of‑stock orders.
- **Open new sales channels** through frictionless social sign‑in and one‑click hosted checkout.
- **Reduce operational risk** with full‑funnel observability (errors, performance and commerce events).
- **Future‑proof the platform** with a stack that supports scale, internationalisation, headless commerce and microservices growth.

### 2.3 Solution objectives mapped to pain points

| Legacy issue                          | Solution objective                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Lack of cross‑platform support        | Responsive MUI layouts, touch‑first controls, viewport metadata, PWA‑ready manifest.                 |
| High initial load time                | `next/image`, MUI package import optimization, route‑level `loading.tsx`, dynamic imports.           |
| Unresponsive UI                       | Debounced search, `useDeferredValue` for results, memoised components, optimistic UI via React Query. |
| Inefficient product search            | Elastic Cloud full‑text search (optional) with in‑memory fallback; `/api/products/search` + cache headers. |
| No inventory awareness                | Per‑SKU `stock` model and `clampAddQuantity()` enforced from PDP, cart and checkout.                  |
| No unified observability              | Sentry (errors), Google Analytics 4 (commerce funnel), New Relic (APM) with no‑op fallbacks.         |

---

## 3. Solution Overview

We propose a **Next.js 16 App Router** storefront, deployed primarily on **Vercel** with a portable **Docker / Kubernetes** runtime, fronting a stateless API layer of **Route Handlers** that integrate with **Stripe Checkout**, **NextAuth v5** (Credentials + Google / GitHub / Facebook / Apple), and a relational data platform (PostgreSQL, post‑MVP).

### 3.1 Capabilities delivered

| Capability area            | What we deliver                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Customer storefront        | Home, PDP, category, search, cart, checkout success, account dashboard.                                    |
| Authentication             | NextAuth v5 with Credentials (bcrypt) + OAuth providers (Google, GitHub, Facebook, Apple) when configured. |
| Catalog + search           | Product model with stock + SKU; Elastic Cloud or in‑memory search; `/api/products/search` with caching.   |
| Cart                       | React Context with `localStorage` persistence and per‑SKU stock clamping.                                  |
| Checkout + payments        | Stripe hosted Checkout Sessions with coupons, free‑shipping rules and signed webhooks.                     |
| Orders                     | Order creation on `checkout.session.completed`; user‑scoped order list, detail and cancellation APIs.       |
| Coupons / promotions       | Server‑validated coupons (`WELCOME10`, `SAVE20`, `FREESHIP`) mirrored into Stripe at session creation.      |
| Account                    | Order history, account dashboard, sign‑out; route protected via `middleware.ts`.                            |
| Observability              | Sentry (errors + replay), GA4 (commerce events), New Relic (APM); all are env‑gated no‑ops.                 |
| Security                   | Security headers, Zod validation, signed webhooks, rate limiting, bcrypt password hashing.                   |

### 3.2 Conceptual architecture

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
│ Credentials │                  │  • Checkout Sessions │                │  • JSON store (MVP)      │
│ + OAuth     │                  │  • Coupons           │                │  • PostgreSQL (Phase 2)  │
│ providers   │                  │  • Webhooks (signed) │                └─────────────────────────┘
└─────────────┘                  └──────────┬───────────┘
                                            │
                                            ▼
                                  ┌──────────────────────┐
                                  │  Order created in    │
                                  │  RIMSS (idempotent)  │
                                  └──────────────────────┘

      Cross‑cutting: Sentry (errors + replay) · GA4 (commerce events) · New Relic APM (server)
```

### 3.3 Why this approach

- **Time to market** — App Router + hosted Stripe Checkout collapses weeks of work (PCI, payment forms, 3DS) into a small, secure integration.
- **Performance by default** — Server Components, edge caching and image optimisation hit the load‑time targets out of the box.
- **Operational simplicity** — Vercel as primary host, with Docker + Kubernetes manifests retained for enterprise hosting portability.
- **Proven on this stack** — a fully working reference implementation already exists in the repository, de‑risking estimates and scope.

---

## 4. Solution Architecture

### 4.1 Logical components

| Component                | Responsibility                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Storefront UI**        | Server‑rendered pages, MUI components, responsive layouts, `next/image`, route‑level `loading.tsx`.                  |
| **Route Handlers (API)** | Server‑side endpoints for checkout, orders, coupons, products and webhooks; Zod‑validated and rate‑limited.          |
| **Auth layer**           | NextAuth v5 providers, JWT sessions (7‑day TTL), bcrypt password hashing, `middleware.ts` guard.                     |
| **Cart context**         | Client‑side React Context, `localStorage` persistence, inventory clamping.                                            |
| **Search index**         | Elastic Cloud when `ELASTICSEARCH_*` env is set; otherwise in‑memory `CatalogIndex` with brand counts (automatic fallback). |
| **Payments**             | Stripe Checkout Sessions, coupons mirrored per session, signed webhooks for fulfilment.                                |
| **Order service**        | Idempotent order creation from `checkout.session.completed`; user‑scoped queries; cancellation rules.                  |
| **Observability**        | Sentry (errors + replay), GA4 (commerce events), New Relic (APM); all gated on env variables.                          |
| **Persistence**          | MVP: JSON store with in‑memory cache. Phase 2: PostgreSQL via Prisma / Drizzle.                                       |

### 4.2 API surface (Route Handlers)

| Endpoint                                  | Method   | Purpose                                                                |
| ----------------------------------------- | -------- | ---------------------------------------------------------------------- |
| `/api/auth/[...nextauth]`                 | GET/POST | NextAuth v5 — credentials + OAuth callbacks.                            |
| `/api/checkout`                           | POST     | Validate cart, create Stripe Checkout Session (with coupon + shipping). |
| `/api/coupons/validate`                   | POST     | Server‑validate a promo code against rules in `src/lib/coupons.ts`.     |
| `/api/products/search`                    | GET      | Rate‑limited catalog search with cache headers.                          |
| `/api/orders`                             | GET      | List orders for the signed‑in user.                                      |
| `/api/orders/[id]`                        | GET      | Fetch one user‑owned order.                                              |
| `/api/orders/[id]/cancel`                 | POST     | Cancel an order while `status === "processing"`.                         |
| `/api/orders/sync`                        | POST     | Reconcile a paid Stripe session when webhooks are not configured.        |
| `/api/webhooks/stripe`                    | POST     | Verify Stripe signature and create the order idempotently.                |

### 4.3 End‑to‑end checkout workflow

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

### 4.4 Authentication workflow

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

### 4.5 Search workflow

```text
User types in /search
   │
   ▼
SearchClient (use-debounce 300 ms) + useProductSearch (React Query)
   │
   ├── URL sync (router.replace) — keeps deep links shareable
   │
   ▼
GET /api/products/search?q=&brands=&min=&max=&sort=
   │
   ├── rateLimit("search:" + ip, 120 / 60s)
   ├── parseFiltersFromSearchParams()
   ▼
searchProducts(filters)   ◄── facade in src/lib/search.ts
   │
   ├── Elastic Cloud configured? ──yes──► searchElasticsearch()
   │         │                              │
   │         │                              ├── multi_match (name^3, brand^2, material^2, …)
   │         │                              ├── brand / price filters + sort
   │         │                              └── on error ──► fall back to memory
   │         │
   │         └── no ──► searchCatalog() (in-memory CatalogIndex)
   ▼
{ products, total, tookMs, source: "elasticsearch" | "memory" }
   (Cache-Control: max-age=30, SWR=60)
```

**Elastic Cloud (optional, demo):** set `ELASTICSEARCH_CLOUD_ID` and `ELASTICSEARCH_API_KEY` (trial at cloud.elastic.co). Seed the index with `npm run search:index` after catalog changes. Without credentials, search stays fully in-memory — suitable for demos that skip Elastic.
### 4.6 Order lifecycle

```text
processing  ──(webhook checkout.session.completed)──► created in store
     │
     ├── cancellable while status === "processing"
     │     └─► POST /api/orders/[id]/cancel  (auth‑guarded; user‑owned)
     │           └─► status = "cancelled", cancelledAt = now()
     │
     ├── shipped     (warehouse update — out of repo, integration point)
     └── delivered   (carrier update — out of repo, integration point)
```

### 4.7 Deployment topology

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

## 5. Technology Stack

### 5.1 Stack summary

| Layer                | Choice                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------- |
| Language             | TypeScript 5 (strict mode)                                                                   |
| Framework            | Next.js 16 (App Router) with React 19                                                        |
| UI library           | Material UI 9 + Emotion 11 (`AppRouterCacheProvider` for SSR)                                |
| Data fetching        | TanStack Query 5                                                                              |
| Validation           | Zod 4                                                                                         |
| Authentication       | NextAuth v5 — Credentials + Google / GitHub / Facebook / Apple OAuth                          |
| Payments             | Stripe 22 (hosted Checkout + signed webhooks)                                                 |
| Password hashing     | bcryptjs                                                                                      |
| Testing              | Vitest 4 + React Testing Library 16 + jsdom 29 + V8 coverage                                  |
| Lint / types         | ESLint (`eslint-config-next`), TypeScript strict                                              |
| Build / runtime      | Webpack dev server, Next.js `standalone` output, Node 22 Alpine container                     |
| CI/CD                | GitHub Actions (lint → test → build → deploy)                                                 |
| Hosting (primary)    | Vercel (`vercel.json`, region `iad1`, security headers)                                       |
| Hosting (portable)   | Docker image + Kubernetes manifests (`Deployment`, `Service`, `ConfigMap`, `Secret`)          |
| Observability        | Sentry, Google Analytics 4, New Relic (all env‑gated)                                         |

### 5.2 Rationale per choice

- **Next.js 16 (App Router)** — fastest route to a server‑rendered, edge‑cached storefront with first‑class image optimisation, route loading states and Route Handlers for a tight API surface. Native fit with Vercel and the standard for modern React e‑commerce.
- **TypeScript strict** — enforced types reduce regression risk in checkout and order code paths.
- **Material UI 9** — accessible, themable, SSR‑safe components, large ecosystem and matched velocity for an apparel storefront.
- **TanStack Query 5** — robust cache, retry and mutation primitives that pair with Route Handlers.
- **Zod** — single source of truth for runtime + compile‑time validation on every API surface.
- **NextAuth v5** — covers Credentials and 50+ OAuth providers; CSRF and cookie hardening built in; works with `middleware.ts` for route protection.
- **Stripe (hosted Checkout)** — keeps Nagarro and YCompany out of PCI scope while still supporting Apple Pay / Google Pay, 3DS, coupons and webhooks.
- **Vitest** — native ESM, Vite‑aligned toolchain, instant watch; significantly faster than Jest on this codebase and easier to configure for the Next.js + RTL combination.
- **Sentry + GA4 + New Relic** — multi‑lens telemetry: defects (Sentry), commerce funnel (GA4), and server APM (New Relic), each free at the relevant tier.

---

## 6. Implementation Approach

### 6.1 Methodology — Agile / Scrum

We propose an Agile / Scrum delivery model with two‑week sprints, a per‑sprint demo and retrospective, and continuous demos on the Vercel preview environment.

| Ceremony           | Frequency      | Output                                                              |
| ------------------ | -------------- | ------------------------------------------------------------------- |
| Sprint planning    | Each sprint    | Committed sprint backlog with acceptance criteria.                  |
| Daily standup      | Daily          | Cross‑role unblockers; max 15 min.                                  |
| Backlog refinement | Weekly         | Estimated, ready‑for‑sprint stories with INVEST criteria.            |
| Sprint review/demo | Each sprint    | Live demo of shipped increments on the preview environment.         |
| Retrospective      | Each sprint    | Three action items per sprint, tracked through to closure.          |
| Scrum of Scrums    | Weekly         | Cross‑team coordination once parallel workstreams begin.            |

### 6.2 Phased delivery plan

We propose a four‑phase delivery, with the MVP available for production beta at the end of Phase 2.

| Phase    | Duration   | Outcome                                                                                                  |
| -------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| Phase 0  | 1 week     | Discovery, environment setup, repo, CI/CD pipeline, design system tokens, observability scaffolding.     |
| Phase 1  | 4 weeks    | Storefront (home, PDP, category, search, cart, auth) on demo data; Stripe Checkout sandbox; foundational tests. |
| Phase 2  | 4 weeks    | Checkout webhook, order lifecycle, coupons, account dashboard, A11y polish, observability live, MVP launch. |
| Phase 3  | 4 weeks    | PostgreSQL data layer migration (Prisma/Drizzle), admin CMS for products + coupons, transactional email.   |
| Phase 4  | 4 weeks    | Wishlist, reviews, internationalisation hooks, advanced analytics, performance budget enforcement.        |

### 6.3 Sprint cadence and Definition of Done

A story is **Done** only when all the following are true:

- Acceptance criteria demonstrated on the Vercel preview URL.
- TypeScript strict passes; ESLint passes.
- Vitest unit/component tests added or updated; coverage thresholds met (`lines/functions ≥ 90 %`, `branches ≥ 85 %`).
- Manual exploratory test pass on mobile and desktop viewports.
- PR reviewed and approved by at least one engineer outside the author's pair.
- Telemetry events added (where applicable) and visible in GA4 / Sentry test environment.
- Documentation updated (`README.md`, `PLAN.md` or the appropriate runbook).

### 6.4 Team composition

The recommended team for a 4‑month engagement to MVP launch:

| Role                              | FTE    | Responsibility                                                                  |
| --------------------------------- | ------ | ------------------------------------------------------------------------------- |
| Engagement Manager                | 0.25   | Commercials, escalation, monthly steering committee.                            |
| Tech Lead / Solution Architect    | 1.00   | Architecture, code reviews, technical risk management, hiring decisions.        |
| Senior Full‑Stack Engineer (Next.js) | 2.00 | Storefront + API delivery, ownership of payments and auth modules.              |
| Full‑Stack Engineer               | 1.00   | Catalog, cart, account and supporting features.                                  |
| QA Engineer (automation focused)  | 1.00   | Test plan, Vitest coverage, Playwright e2e (Phase 2+), regression suite.        |
| DevOps Engineer                   | 0.50   | CI/CD, Vercel + Kubernetes config, secret management, observability hookup.     |
| UI/UX Designer                    | 0.50   | Design system tokens, storefront flows, A11y reviews.                            |
| Product Owner (YCompany side)     | 0.50   | Acceptance criteria, prioritisation, content sign‑off.                          |

### 6.5 Governance and reporting

- **Weekly status report** — burn‑down, velocity, risks, open decisions.
- **Bi‑weekly sprint demo** — invite open to all YCompany stakeholders.
- **Monthly steering committee** — financial, commercial, scope and strategic alignment.
- **Quarterly business review** — performance against business KPIs.
- **Single source of truth** — JIRA for backlog/sprints, Confluence (or Microsoft Teams Wiki) for living documentation, GitHub for code and PR history.

---

## 7. Quality Assurance Approach

### 7.1 Test strategy

We adopt a layered test strategy aligned with the test pyramid.

| Layer                          | Tool                                | Scope                                                                |
| ------------------------------ | ----------------------------------- | -------------------------------------------------------------------- |
| Unit + component tests         | Vitest + React Testing Library      | Pure functions, hooks, components, contexts, coupon engine.          |
| Integration tests              | Vitest with Route Handler fixtures  | Auth callbacks, checkout, coupons, orders endpoints.                  |
| End‑to‑end (E2E)               | Playwright (introduced in Phase 2)  | Critical journeys: browse → cart → checkout → account.               |
| Accessibility                  | axe-core in CI (Phase 2)            | WCAG 2.1 AA on home, PDP, search, cart, checkout, account.           |
| Performance                    | Lighthouse CI                       | Performance, A11y, Best Practices, SEO budgets per route.            |
| Security                       | `npm audit`, Dependabot, Snyk (opt) | Dependency CVEs and SAST scanning per PR.                             |

### 7.2 Coverage targets and CI gates

The CI pipeline blocks any PR that fails any of the following:

- `npm run lint` — ESLint with `eslint-config-next` and TypeScript rules.
- `tsc --noEmit` — TypeScript strict.
- `npm run test:ci` — Vitest with V8 coverage thresholds: `lines ≥ 90 %`, `functions ≥ 90 %`, `statements ≥ 90 %`, `branches ≥ 85 %`.
- `npm run build` — Next.js production build (with env vars validated).
- Playwright smoke (Phase 2+).
- Lighthouse budget (Phase 2+).

### 7.3 Code review

- Every change is delivered through a Pull Request — no direct pushes to `main`.
- At least one approval is required from an engineer outside the author's pair.
- Review checklist focuses on: correctness, tests, security, accessibility, performance, observability hooks, documentation.
- Tech Lead pairs are routed for changes to checkout, payments, auth and webhooks.

### 7.4 Test environments

| Environment      | Purpose                                                                       |
| ---------------- | ----------------------------------------------------------------------------- |
| Local            | Engineer's machine; Stripe CLI for webhooks; no production secrets.            |
| PR preview       | Per‑PR Vercel deployment with Stripe test mode and dummy auth providers.       |
| Integration      | Shared environment for QA regression; reset weekly.                            |
| Staging          | Production parity; used for UAT and pre‑release performance testing.           |
| Production       | Vercel production deployment; restricted access; observability live.           |

---

## 8. Security and Compliance Approach

### 8.1 Application security

- **HTTP security headers** — `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `X-DNS-Prefetch-Control: on` (all in `next.config.ts`).
- **Input validation** — Zod schemas on every Route Handler payload (search filters, checkout body, coupon code, orders).
- **Rate limiting** — in‑memory bucket limiter on `/api/checkout` (20/min/IP) and `/api/products/search` (120/min/IP). Will graduate to Upstash Redis in Phase 3.
- **Password hashing** — bcryptjs for the Credentials provider; demo hash supplied via `AUTH_DEMO_PASSWORD_HASH`.
- **JWT sessions** — NextAuth JWT strategy, 7‑day TTL; signed with `AUTH_SECRET`.
- **Route protection** — `middleware.ts` redirects unauthenticated traffic from `/account` back to `/login` with a `callbackUrl`.
- **Stripe webhooks** — every webhook signature is verified before any state change; orders are idempotent on `stripeSessionId`.

### 8.2 Data protection

- Customer PII is minimised; we store only email, display name, image (when supplied via OAuth) and order data.
- No card data ever transits or rests on YCompany infrastructure — payments are taken on Stripe's hosted Checkout.
- Secrets are managed via Vercel environment variables (production) and Kubernetes `Secret` objects (portable runtime).
- Sentry `sendDefaultPii: false` keeps personal identifiers out of error telemetry.

### 8.3 Compliance

- **PCI DSS** — out of scope by design (hosted Checkout / SAQ A).
- **GDPR / CCPA** — we will deliver a cookie consent banner, privacy notice, data export and account deletion APIs in Phase 3.
- **WCAG 2.1 AA** — accessibility audits performed before every release; axe-core in CI from Phase 2.
- **OWASP ASVS L1** — used as the minimum target; security checklist enforced in PR reviews.

### 8.4 Secret rotation

- AUTH_SECRET — rotated quarterly; both old and new accepted for 24 h via dual‑key support.
- STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET — rotated on personnel changes; tested on staging before production cut‑over.
- OAuth client secrets — rotated annually or on partner request.

---

## 9. DevOps and Deployment Approach

### 9.1 Source control and branching

- **GitHub** monorepo for the storefront, infrastructure manifests and documentation.
- **Trunk‑based** with short‑lived feature branches; `main` always deployable.
- Conventional Commits + Squash merges keep `main` history clean and changelog‑friendly.

### 9.2 CI/CD pipeline (GitHub Actions)

```text
push / PR
   │
   ▼
┌─────────────┐   ┌──────────────┐   ┌─────────────┐   ┌──────────────────┐
│  npm ci     │ → │  lint + tsc  │ → │  vitest CI  │ → │  npm run build   │
└─────────────┘   └──────────────┘   └─────────────┘   └────────┬─────────┘
                                                                │ (PR)
                                                                ▼
                                                ┌───────────────────────────┐
                                                │  Vercel preview deploy    │
                                                │  → comment on PR with URL │
                                                └───────────────────────────┘
                                                                │ (merge to main)
                                                                ▼
                                                ┌───────────────────────────┐
                                                │  Vercel production deploy │
                                                │  Sentry release + sourcemaps│
                                                └───────────────────────────┘
```

### 9.3 Environments

| Environment   | Trigger                                | URL pattern                        |
| ------------- | -------------------------------------- | ---------------------------------- |
| Preview       | Every PR                               | `https://ycompany-<sha>.vercel.app` |
| Staging       | Merge to `main` (auto)                  | `https://staging.ycompany.com`     |
| Production    | Manual approval after staging green    | `https://www.ycompany.com`         |

### 9.4 Release management

- Releases follow **semantic versioning**.
- Each merge to `main` triggers a Vercel production deploy with an automatically created Sentry release for source‑map symbolication.
- A weekly release notes summary is posted to the YCompany Teams channel.

### 9.5 Containerised / Kubernetes runtime

For YCompany teams that prefer a self‑hosted runtime, the same code base produces a `node:22-alpine` standalone container. Kubernetes manifests deliver:

- `Deployment` with `replicas: 2` (HPA recommended).
- `Service` (ClusterIP) and Ingress (TLS) — bring‑your‑own ingress controller.
- `ConfigMap` for non‑secret env vars; `Secret` for secrets.
- Readiness and liveness probes on `GET /`.

---

## 10. Observability and Operations

### 10.1 Telemetry signals

| Signal     | Tool             | Purpose                                                                |
| ---------- | ---------------- | ---------------------------------------------------------------------- |
| Errors     | Sentry           | Client + server exceptions, session replay, release attribution.        |
| Metrics    | New Relic        | APM, throughput, latency, error rate, infrastructure metrics.           |
| Commerce   | Google Analytics 4 | `add_to_cart`, `remove_from_cart`, `begin_checkout`, `purchase`, `search`, `apply_coupon`, etc. |
| Logs       | Vercel / stdout  | Structured Route Handler logs; can be shipped to Datadog/Loki on K8s.   |
| Synthetics | Vercel Monitors  | Continuous probes on critical routes (Phase 3).                         |

### 10.2 Service Level Objectives (SLOs)

- **Availability** — 99.9 % monthly availability for the storefront.
- **Latency** — p95 First Contentful Paint &lt; 3 seconds on 4G.
- **Checkout success rate** — &gt; 98 % of Stripe Checkout sessions that begin reach `complete`.
- **Error budget** — 0.1 % monthly; consumption is tracked in the monthly steering committee.

### 10.3 Incident response

| Severity | Definition                                | Response | Resolution target |
| -------- | ----------------------------------------- | -------- | ----------------- |
| P1       | Site down or checkout broken              | 15 min   | 4 hours           |
| P2       | Major feature degraded                    | 1 hour   | 1 business day    |
| P3       | Minor defect, no workaround needed        | 1 day    | Next sprint       |
| P4       | Cosmetic / enhancement                    | 3 days   | Backlog           |

- On‑call rotation for engineering after Phase 2 launch.
- Sentry alerts trigger PagerDuty (or equivalent) → on‑call engineer acknowledges within SLA.
- Post‑incident review (blameless) within 5 business days for every P1/P2 event.

### 10.4 Continuous improvement

- Weekly observability review (errors, slow queries, conversion drop‑offs).
- Monthly performance budget review.
- Quarterly chaos / DR drill (Phase 3+).

---

## 11. Project Management and Governance

### 11.1 Decision making

- **Engagement Manager (Nagarro)** + **YCompany Sponsor** form the joint Steering Committee.
- **Tech Lead** owns all technical decisions; design decisions are recorded as lightweight ADRs (Architecture Decision Records) in the repo.
- Scope changes follow a formal Change Request process documented in the PMO playbook.

### 11.2 RACI summary

| Activity                              | Nagarro EM | Nagarro Tech Lead | Nagarro QA | YCompany PO | YCompany Sponsor |
| ------------------------------------- | ---------- | ----------------- | ---------- | ----------- | ---------------- |
| Sprint planning / refinement          | C          | A                 | C          | R           | I                |
| Backlog prioritisation                | I          | C                 | I          | A           | C                |
| Architectural decisions               | I          | A                 | C          | C           | I                |
| Code review & merge                   | I          | A                 | C          | I           | I                |
| Release approval to production        | C          | R                 | C          | A           | I                |
| Incident response P1/P2               | C          | A                 | R          | I           | I                |
| Change request approval               | R          | C                 | I          | C           | A                |

R = Responsible · A = Accountable · C = Consulted · I = Informed

### 11.3 Reporting cadence

- **Daily** — JIRA standup notes posted to Teams.
- **Weekly** — written status report (RAG, scope, schedule, cost, risk).
- **Bi‑weekly** — sprint demo + retro action items.
- **Monthly** — steering committee deck.
- **Quarterly** — business review against KPIs.

### 11.4 Tooling

| Need                | Tool                                             |
| ------------------- | ------------------------------------------------ |
| Backlog & sprints   | JIRA                                              |
| Documentation       | Confluence / GitHub `docs/` folder                |
| Source control      | GitHub                                            |
| CI/CD               | GitHub Actions                                    |
| Communication       | Microsoft Teams                                   |
| Observability       | Sentry, GA4, New Relic                            |
| Incident routing    | PagerDuty (or YCompany's preferred tool)         |

---

## 12. Risk Management

### 12.1 Technical risks

- **Integration with Stripe** — misconfiguration of webhooks could cause orders to be missed.
  _Mitigation:_ signed webhook verification, idempotent order creation, `/api/orders/sync` fallback, monitoring of `checkout.session.completed` event count.
- **Performance regressions** — adding features can erode performance budgets.
  _Mitigation:_ Lighthouse CI per PR (Phase 2+), MUI package import optimisation enforced, `next/image` mandatory for product imagery.
- **OAuth provider downtime** — third‑party login outages impact sign‑in.
  _Mitigation:_ Credentials login always available as fallback; status page polled; clear UX messaging.
- **Inventory drift** — the demo JSON store will not survive concurrent updates.
  _Mitigation:_ migrate to PostgreSQL in Phase 3 with row‑level locks; pre‑Phase‑3 production traffic is throttled.

### 12.2 Project management risks

- **Scope creep** — uncontrolled additions during stakeholder demos.
  _Mitigation:_ formal Change Request process; sprint demos focused on committed items; PO empowered to defer.
- **Resource availability** — key engineers may take leave during the engagement.
  _Mitigation:_ paired ownership of critical modules (auth, payments, checkout); succession plan for tech lead.
- **Decision latency** — slow approvals from business stakeholders can block sprints.
  _Mitigation:_ steering committee with defined SLAs for decisions; escalation path documented.

### 12.3 Business risks

- **User adoption** — customers may resist a new UX.
  _Mitigation:_ phased rollout with A/B testing on key surfaces; GA4 funnel monitoring; rapid response to friction signals.
- **Cost overruns** — Vercel usage spikes or unexpected Stripe fees.
  _Mitigation:_ Vercel usage alerts; monthly cost review; Stripe fee modelling baked into the commercial proposal.
- **Regulatory compliance** — GDPR / CCPA changes during the engagement.
  _Mitigation:_ legal review checkpoint each quarter; cookie banner + data export endpoints planned for Phase 3.

### 12.4 Operational risks

- **System downtime** — incident during peak shopping windows.
  _Mitigation:_ Vercel atomic deploys + Kubernetes rolling deploys; freeze windows for major releases during Black Friday week; documented rollback playbook.
- **Vendor reliability** — third‑party outages.
  _Mitigation:_ all third‑party integrations are env‑gated no‑ops, so the storefront keeps serving even when Sentry/GA4/Stripe degrade.
- **Data loss** — accidental deletion of orders.
  _Mitigation:_ PostgreSQL nightly snapshots (Phase 3); 7‑day retention; tested restore drill quarterly.

---

## 13. Assumptions, Dependencies and Constraints

### 13.1 Assumptions

- YCompany will nominate a Product Owner with a minimum of 50 % availability for the duration of the engagement.
- YCompany will provide brand assets (logos, fonts, photography licences) by the end of Sprint 0.
- Stripe is the agreed payment processor and Stripe accounts (test + live) will be provisioned by YCompany.
- OAuth provider apps (Google, GitHub, Facebook, Apple) will be registered by YCompany; Nagarro will supply redirect URIs.
- Hosting on Vercel is acceptable; if YCompany prefers self‑hosted Kubernetes, the existing manifests will be the starting point.
- Observability vendors (Sentry, GA4, New Relic) will be provisioned by YCompany and credentials shared securely.

### 13.2 Dependencies

| Dependency                              | Owner       | Required by      |
| --------------------------------------- | ----------- | ---------------- |
| Stripe test + live accounts             | YCompany    | Sprint 1         |
| OAuth provider apps                     | YCompany    | Sprint 2         |
| Brand assets (logos, fonts, photography) | YCompany    | End of Sprint 0  |
| Production domain + DNS                 | YCompany    | Phase 2 release  |
| Sentry / GA4 / New Relic accounts       | YCompany    | Phase 2 release  |
| PostgreSQL (managed)                    | YCompany    | Phase 3          |
| Email provider for transactional email  | YCompany    | Phase 3          |

### 13.3 Constraints

- Initial budget and timeline confirmed in the commercial proposal; any expansion follows the Change Request process.
- The MVP must support modern evergreen browsers (Chrome, Safari, Edge, Firefox — last two major versions) and iOS Safari / Android Chrome on the last two major OS versions. IE 11 is explicitly out of scope.
- All customer‑facing copy will be sourced from YCompany; Nagarro provides placeholder lorem only in early sprints.

---

## 14. Commercials and Effort (summary)

A detailed effort breakdown, role rates, blended rate and project commercials are provided in the companion **Estimates workbook** (separate Excel deliverable). At a glance:

- **Engagement model** — Time & Materials with a not‑to‑exceed (NTE) ceiling per phase.
- **Engagement duration** — 16 weeks to MVP launch, with an optional 12‑week hardening + Phase 3/4 extension.
- **Pricing** — onsite + offshore blended rate, billed monthly against signed timesheets and the agreed Statement of Work.
- **Acceptance criteria** — per phase, signed off by the YCompany Product Owner against agreed acceptance criteria.

*Note: commercial terms are summarised here for completeness. The authoritative figures are in the Estimates‑Template.xltm workbook and the Statement of Work.*

---

## 15. Glossary

- **RIMSS** — Retail Inventory Management Software System, the YCompany storefront with inventory awareness.
- **RFP** — Request For Proposal.
- **MVP** — Minimum Viable Product; the first production release with the smallest feature set that delivers measurable value.
- **DAR** — Design Architecture Recommendation; the technical design document accompanying this Solution Approach.
- **App Router** — Next.js 13+ routing model under `src/app/`, replacing the legacy `pages/` router.
- **Route Handler** — `route.ts` file exporting HTTP methods (`GET`, `POST`, …) inside `src/app/api/`.
- **RSC** — React Server Components; rendered on the server, no JavaScript shipped for the component itself.
- **JWT** — JSON Web Token; the session strategy used by NextAuth v5.
- **OAuth** — Open Authorization; protocol used by the Google / GitHub / Facebook / Apple providers.
- **Stripe Checkout** — Stripe‑hosted, PCI‑scoped payment page consumed via Checkout Sessions.
- **Webhook** — Signed asynchronous HTTP callback (`/api/webhooks/stripe`) that creates the order on payment.
- **SLO / SLA** — Service Level Objective / Agreement.
- **RACI** — Responsibility assignment matrix: Responsible, Accountable, Consulted, Informed.

---

## 16. Appendix

### 16.1 Reference architecture documents

- **DAR — YCompany RIMSS** — full as‑built design (`DAR - YCompany.pdf` / `DAR - YCompany.docx`).
- **README.md** — engineering setup, scripts, observability and deploy summary.
- **PLAN.md** — phased roadmap, problem‑to‑solution mapping, next steps.
- **docs/DEPLOY-VERCEL.md** — step‑by‑step Vercel deployment guide.
- **k8s/*.yaml** — Kubernetes manifests (`Deployment`, `Service`, `ConfigMap`, `Secret`).
- **Dockerfile** — multi‑stage build for the standalone Next.js runtime.
- **vitest.config.ts** — test runner and coverage thresholds.

### 16.2 Module map (`src/`)

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
│   ├── search.ts             search facade (Elastic + memory fallback)
│   ├── search-index.ts       in‑memory catalog search (fallback)
│   ├── elasticsearch/        Elastic Cloud client, mapping, query
│   └── stripe.ts             lazy Stripe SDK client
├── scripts/
│   └── index-products.ts     seed Elastic index (`npm run search:index`)
├── middleware.ts             NextAuth‑aware route protection
├── providers/QueryProvider   TanStack Query client provider
├── theme/                    MUI theme + form field styles
└── types/                    Product, Order, NextAuth augmentation
```
### 16.3 Contact

- **Engagement Lead:** Pawan Gupta — pawan.gupta@nagarro.com — +91 98112 83937

### 16.4 Additional resources

- Stripe Checkout documentation and webhook reference.
- NextAuth.js v5 (Auth.js) documentation.
- Next.js 16 App Router release notes.
- WCAG 2.1 AA quick reference.
- OWASP ASVS L1 checklist.

This appendix consolidates the supporting material for Nagarro's RIMSS Solution Approach, ensuring that the YCompany evaluation team has all relevant references at hand alongside the main document.
