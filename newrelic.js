"use strict";

/**
 * New Relic Node.js agent — loaded via instrumentation.ts or `node -r newrelic`.
 * @see https://docs.newrelic.com/docs/apm/agents/nodejs-agent/
 */
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
};
