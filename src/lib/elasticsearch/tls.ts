import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Load corporate-ca-bundle.pem (Zscaler / MITM proxy) when present.
 * Same pattern as newrelic.js — needed for Elastic Cloud HTTPS from this network.
 */
export function loadCorporateCaBundle(): Buffer | undefined {
  const bundlePath = join(process.cwd(), "corporate-ca-bundle.pem");
  if (!existsSync(bundlePath)) return undefined;
  try {
    return readFileSync(bundlePath);
  } catch {
    return undefined;
  }
}

/** TLS options for @elastic/elasticsearch when a corporate CA bundle exists. */
export function elasticsearchTlsOptions():
  | { ca: Buffer; rejectUnauthorized: true }
  | undefined {
  const ca = loadCorporateCaBundle();
  if (!ca) return undefined;
  return { ca, rejectUnauthorized: true };
}
