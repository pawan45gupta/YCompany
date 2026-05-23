# Deploy YCompany on Vercel

## Option A — Vercel Dashboard (recommended)

1. Push this repo to **GitHub**, **GitLab**, or **Bitbucket** (main branch).

2. Open [vercel.com/new](https://vercel.com/new) → **Import** your repository.

3. Framework is auto-detected as **Next.js**. Leave defaults:
   - **Build Command:** `npm run build`
   - **Output Directory:** (leave empty — Next.js default)
   - **Install Command:** `npm install`

4. Add **Environment Variables** (Production + Preview). Required for a successful build:

   | Variable | Required | Notes |
   |----------|----------|--------|
   | `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
   | `AUTH_DEMO_PASSWORD_HASH` | Yes | Bcrypt hash from `.env.example` |
   | `AUTH_DEMO_EMAIL` | Yes | `demo@ycompany.com` |
   | `AUTH_URL` | Yes | `https://YOUR-PROJECT.vercel.app` |
   | `NEXTAUTH_URL` | Yes | Same as `AUTH_URL` |
   | `NEXT_PUBLIC_SITE_URL` | Yes | Same as `AUTH_URL` |
   | `STRIPE_SECRET_KEY` | For checkout | `sk_test_...` or live key |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For checkout | `pk_test_...` |
   | `STRIPE_WEBHOOK_SECRET` | For webhooks | From Stripe → Webhooks |

   Optional observability (copy from `.env.local`):

   | Variable | Purpose |
   |----------|---------|
   | `NEXT_PUBLIC_SENTRY_DSN` | Sentry errors |
   | `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Source maps |
   | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics |
   | `NEW_RELIC_LICENSE_KEY`, `NEW_RELIC_APP_NAME` | APM (limited on serverless) |

5. Click **Deploy**. First deploy takes ~2–4 minutes.

6. After deploy, update URLs if you add a custom domain:
   - Set `AUTH_URL`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_SITE_URL` to `https://your-domain.com`
   - Redeploy

### Stripe webhook (production)

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://YOUR-DOMAIN/api/webhooks/stripe`
3. Events: `checkout.session.completed` (and any others you handle)
4. Copy **Signing secret** → Vercel env `STRIPE_WEBHOOK_SECRET` → Redeploy

---

## Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
cd /path/to/YCompany
vercel link
vercel env pull .env.vercel.local   # optional: sync env from dashboard
vercel --prod
```

If login fails behind a corporate proxy, use **Option A** (browser) or set a token:

```bash
export VERCEL_TOKEN=your_token_from_vercel.com/account/tokens
vercel --prod --token "$VERCEL_TOKEN"
```

---

## Git: SSH key added but still “Missing or invalid credentials”

**SSH keys do not apply to HTTPS remotes.** Check your remote:

```bash
git remote -v
```

| Remote URL | What to use |
|------------|-------------|
| `https://github.com/...` | GitHub **Personal Access Token** as password (not your SSH key) |
| `git@github.com:...` | Your **SSH key** |

Switch to SSH (recommended if you added an SSH key):

```bash
git remote set-url origin git@github.com:pawan45gupta/YCompany.git
ssh -T git@github.com   # should say: Hi pawan45gupta!
git push -u origin main
```

First-time SSH: if you see `Host key verification failed`, run:

```bash
ssh-keyscan github.com >> ~/.ssh/known_hosts
```

## Vercel: “Missing or invalid credentials” when importing Git

This is **not** your repo SSH key. Vercel needs **GitHub OAuth**:

1. [vercel.com/account/integrations](https://vercel.com/account/integrations) → **GitHub** → Connect / Reconnect
2. Grant access to the `pawan45gupta` account and the **YCompany** repository
3. Import again at [vercel.com/new](https://vercel.com/new)

If the repo is private, ensure Vercel has permission to read it (GitHub → Settings → Applications → Vercel).

## Site login: “Invalid email or password” on Vercel

Demo login: `demo@ycompany.com` / `YCompanyDemo!2026`

In **Vercel → Project → Settings → Environment Variables**, set `AUTH_DEMO_PASSWORD_HASH` to the **raw** bcrypt string (no `\` before `$`):

```
$2b$10$aqCHeAPV0ACX2C40a20RBO8D.bP7RPq3fYN5Y/umMs6QKptm44xW6
```

Also set `AUTH_SECRET`, `AUTH_URL`, and `NEXTAUTH_URL` to your `https://….vercel.app` URL, then **Redeploy**.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on `AUTH_SECRET` | Add all required env vars before build |
| Sign-in redirects to localhost | Set `AUTH_URL` / `NEXTAUTH_URL` to the Vercel URL |
| Images 500 on Vercel | Unlikely on Vercel; locally set `IMAGE_UNOPTIMIZED=true` |
| Sentry build warnings | Add `SENTRY_AUTH_TOKEN` or leave DSN-only (source maps disabled) |

---

## Project config

- `vercel.json` — region `iad1`, security headers
- `next.config.ts` — Sentry wrapper when `NEXT_PUBLIC_SENTRY_DSN` is set
