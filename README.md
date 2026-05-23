# YCompany

Next.js apparel ecommerce: **Material UI**, **NextAuth** (credentials), **Stripe Checkout**, **Vitest + React Testing Library**, **Docker** (standalone), **Kubernetes** manifests, **Vercel**-ready.

## Setup

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Set `AUTH_SECRET` (e.g. `openssl rand -base64 32`), Stripe test keys from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys), and optional `NEXT_PUBLIC_SITE_URL` for production URLs in metadata/sitemap.

3. Demo login (see `.env.example` for the bcrypt hash): email `demo@ycompany.com`, password `YCompanyDemo!2026`.

4. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Development server (webpack; required for NextAuth API routes in Next.js 16) |
| `npm run build` | Production build (requires env vars from `.env.example`) |
| `npm run start` | Start production server |
| `npm run test` / `npm run test:ci` | Vitest |

## Observability (optional)

Set keys in `.env.local` — all integrations are **no-ops** when variables are empty.

| Tool | Purpose | Env vars |
|------|---------|----------|
| **Sentry** | Error tracking, session replay, performance traces | `NEXT_PUBLIC_SENTRY_DSN`, optional `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` |
| **Google Analytics** | Page views and engagement (GA4) | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| **New Relic** | APM, server metrics, distributed tracing | `NEW_RELIC_LICENSE_KEY`, `NEW_RELIC_APP_NAME` |

- API errors: use `reportError()` from `src/lib/observability/errors.ts`
- Production with New Relic locally: `npm run start:monitored`
- Docker/K8s: set `NEW_RELIC_LICENSE_KEY` on the container (agent preloads automatically)

## Docs

- Roadmap and feature checklist: [PLAN.md](./PLAN.md)
- Stripe webhooks locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Deploy

### Vercel (recommended)

The repo includes `vercel.json` for Next.js. **Step-by-step:** [docs/DEPLOY-VERCEL.md](./docs/DEPLOY-VERCEL.md)

1. Push to GitHub/GitLab/Bitbucket.
2. [Import on Vercel](https://vercel.com/new) → select the repo.
3. Add environment variables (at minimum `AUTH_SECRET`, `AUTH_DEMO_PASSWORD_HASH`, `AUTH_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL` — all set to your `https://….vercel.app` URL after the first deploy).
4. Deploy.

CLI (after `vercel login`): `npm run deploy`

### Other targets

- **Docker**: `docker build -t ycompany .` (pass build args for `AUTH_SECRET`, Stripe keys, etc.).
- **Kubernetes**: see `k8s/` — create ConfigMap/Secret from the `*.example.yaml` files, then `kubectl apply -f k8s/`.
