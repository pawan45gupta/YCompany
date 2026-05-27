"use strict";

/**
 * New Relic Node.js agent — loaded via instrumentation.ts or `node -r newrelic`.
 * @see https://docs.newrelic.com/docs/apm/agents/nodejs-agent/
 */

const fs = require("fs");
const path = require("path");

/**
 * Load the corporate CA bundle so the NR agent can reach collector.newrelic.com
 * through a Zscaler / MITM TLS-inspection proxy.
 *
 * We ALWAYS load this when the file exists — even when NODE_EXTRA_CA_CERTS is
 * also set — because the two mechanisms work independently:
 *   - NODE_EXTRA_CA_CERTS:    affects Node.js's built-in TLS SecureContext
 *   - config.certificates:   affects the NR agent's own outbound connections
 *
 * Both are needed because the agent creates its own TLS sockets and the
 * timing of when NODE_EXTRA_CA_CERTS is read relative to when Next.js
 * loads .env.local is not guaranteed.
 *
 * Returns an array of PEM strings, or undefined when the file is absent
 * (e.g. production / non-proxied environments).
 */
function loadCorporateCerts() {
  const bundlePath = path.join(__dirname, "corporate-ca-bundle.pem");
  if (!fs.existsSync(bundlePath)) return undefined;

  try {
    const raw = fs.readFileSync(bundlePath, "utf8");
    const certs = raw.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g);
    if (!certs || certs.length === 0) return undefined;
    console.log(`[newrelic.js] Loaded ${certs.length} corporate CA cert(s) from ${bundlePath}`);
    return certs;
  } catch (err) {
    console.warn("[newrelic.js] Failed to read corporate-ca-bundle.pem:", err.message);
    return undefined;
  }
}

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || "YCompany"],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || "",
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || "info",
  },
  distributed_tracing: {
    enabled: true,
  },
  application_logging: {
    enabled: true,
    forwarding: {
      enabled: true,
    },
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      "request.headers.cookie",
      "request.headers.authorization",
      "request.headers.x-api-key",
    ],
  },
  // Provide the corporate CA bundle so the agent's own TLS connections trust
  // the Zscaler root CA. Undefined in production (file won't exist there).
  certificates: loadCorporateCerts(),
};
