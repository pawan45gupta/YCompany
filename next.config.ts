import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  /** Ensures `stripe` (Node SDK) resolves in App Router / Turbopack instead of failing to bundle. */
  serverExternalPackages: ["stripe", "newrelic"],
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
  },
  images: {
    /**
     * Dev (and IMAGE_UNOPTIMIZED=true) load remotes in the browser.
     * Avoids 500s when a corporate proxy breaks Node TLS fetch to Unsplash.
     */
    unoptimized:
      process.env.NODE_ENV === "development" ||
      process.env.IMAGE_UNOPTIMIZED === "true",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

const sentryEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      // NB: `disableLogger` and `automaticVercelMonitors` were removed.
      // Their successors live under `webpack.*` (e.g.
      // `webpack.treeshake.removeDebugLogging`,
      // `webpack.automaticVercelMonitors`) and only take effect with the
      // webpack bundler. This project builds with Turbopack
      // (`next build`/`next dev --webpack` aside), where the entire
      // `webpack.*` section is ignored — so we omit them rather than
      // carry dead config that emits deprecation warnings on every build.
      sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
      },
    })
  : nextConfig;
