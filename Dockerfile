# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG AUTH_SECRET=build-placeholder-min-32-chars-long
ARG AUTH_DEMO_PASSWORD_HASH
ARG STRIPE_SECRET_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000

ENV AUTH_SECRET=$AUTH_SECRET
ENV AUTH_DEMO_PASSWORD_HASH=$AUTH_DEMO_PASSWORD_HASH
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Run stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/newrelic.js ./newrelic.js
COPY --from=builder /app/node_modules/newrelic ./node_modules/newrelic
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Preload New Relic when NEW_RELIC_LICENSE_KEY is set at runtime
CMD ["sh", "-c", "if [ -n \"$NEW_RELIC_LICENSE_KEY\" ]; then exec node -r newrelic server.js; else exec node server.js; fi"]
