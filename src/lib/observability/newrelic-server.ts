/**
 * Server-side New Relic Node-agent wrapper.
 *
 * The Node agent is loaded once from `instrumentation.ts` via dynamic
 * `import("newrelic")` when `NEW_RELIC_LICENSE_KEY` is present. This module
 * is the *only* place application code should reach into the agent — that
 * keeps the rest of the codebase free of `require("newrelic")` side-effects
 * and free of conditional `if (process.env.NEW_RELIC_LICENSE_KEY)` checks.
 *
 * Every export here is a no-op when:
 *   - the agent is not loaded (no license key), OR
 *   - the dynamic import fails for any reason (e.g. agent was removed from
 *     `serverExternalPackages` and tree-shaken).
 *
 * Why dynamic import? `newrelic` is a heavy native-bound package that does
 * file I/O at import time and refuses to start without a license key. We
 * lazy-load it so:
 *   - unit tests never pay the cost (they don't set `NEW_RELIC_LICENSE_KEY`)
 *   - edge runtimes (where `newrelic` cannot run) don't blow up at module
 *     evaluation time.
 */

import { isNewRelicEnabled } from "@/lib/observability/env";

// `Newrelic` is the type of the entire agent module. We deliberately avoid
// `import type` because @types/newrelic uses `export const` for instrument
// helpers — `typeof import("newrelic")` is the cleanest way to grab the
// whole surface.
type NewrelicAgent = typeof import("newrelic");

/**
 * Cached agent handle. `undefined` means "we haven't tried yet"; `null`
 * means "we tried and either the agent is disabled or the import failed —
 * stop retrying". A resolved agent stays cached for the process lifetime.
 */
let agentCache: NewrelicAgent | null | undefined;
let agentPromise: Promise<NewrelicAgent | null> | undefined;

async function loadAgent(): Promise<NewrelicAgent | null> {
  if (agentCache !== undefined) return agentCache;
  if (!isNewRelicEnabled()) {
    agentCache = null;
    return null;
  }
  if (!agentPromise) {
    agentPromise = (async () => {
      try {
        // `instrumentation.ts` already started the agent on boot; this
        // `import` simply hands us the public API surface — the agent's
        // singleton state is shared across calls.
        const mod = (await import("newrelic")) as NewrelicAgent;
        agentCache = mod;
        return mod;
      } catch (err) {
        // Could be: running on Edge runtime, license key set but native
        // bindings missing, etc. Log once at debug level and never throw —
        // observability must never break the request path.
        console.warn("[newrelic] agent import failed; events disabled", err);
        agentCache = null;
        return null;
      }
    })();
  }
  return agentPromise;
}

/** Attribute values accepted by the NR agent's `recordCustomEvent`. */
type NrPrimitive = string | number | boolean;
type NrAttributes = Record<string, NrPrimitive | null | undefined>;

/** Strip null/undefined and stringify Date so the agent never rejects the call. */
function sanitize(attrs: NrAttributes | undefined): Record<string, NrPrimitive> {
  if (!attrs) return {};
  const out: Record<string, NrPrimitive> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

/**
 * Record a custom event in the NR Events product.
 *
 * Naming convention: PascalCase event types matching the GA4 event names
 * but capitalised (e.g. `AddToCart`, `BeginCheckout`, `Login`). Querying
 * looks like `SELECT * FROM AddToCart SINCE 1 hour ago`.
 *
 * Returns a promise that resolves once the agent has buffered the event
 * (typically <1ms). Callers should `void` this — never `await` in a hot
 * request path.
 */
export async function nrRecordEvent(
  eventType: string,
  attrs?: NrAttributes,
): Promise<void> {
  const agent = await loadAgent();
  if (!agent) return;
  try {
    // `recordCustomEvent` returns `undefined | false` (false on validation
    // failure). We ignore the result on purpose; bad attributes shouldn't
    // crash the route, but they ARE a developer bug, so surface them in dev.
    const result = agent.recordCustomEvent(eventType, sanitize(attrs));
    if (result === false && process.env.NODE_ENV !== "production") {
      console.warn(`[newrelic] recordCustomEvent("${eventType}") rejected`);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[newrelic] recordCustomEvent("${eventType}") threw`, err);
    }
  }
}

/** Attach a custom attribute to the current request transaction. */
export async function nrAddCustomAttribute(
  key: string,
  value: NrPrimitive,
): Promise<void> {
  const agent = await loadAgent();
  if (!agent) return;
  try {
    agent.addCustomAttribute(key, value);
  } catch {
    /* swallow */
  }
}

/** Tag the current transaction with the authenticated user id. */
export async function nrSetUserId(userId: string): Promise<void> {
  const agent = await loadAgent();
  if (!agent) return;
  try {
    agent.setUserID(userId);
  } catch {
    /* swallow */
  }
}

/**
 * Forward a handled error to NR with optional custom attributes. Use
 * sparingly — unhandled exceptions are auto-captured by the agent.
 */
export async function nrNoticeError(
  err: unknown,
  attrs?: NrAttributes,
): Promise<void> {
  const agent = await loadAgent();
  if (!agent) return;
  try {
    const realError =
      err instanceof Error
        ? err
        : new Error(typeof err === "string" ? err : "Non-Error thrown");
    agent.noticeError(realError, sanitize(attrs));
  } catch {
    /* swallow */
  }
}

/**
 * Return the NR Browser timing header HTML. When mounted in the document
 * `<head>` (server-side), this auto-instruments the page with Browser RUM:
 * pageviews, AJAX timing, JS errors, SPA route changes, and any
 * `window.newrelic.addPageAction(...)` calls we make client-side.
 *
 * Returns an empty string when the agent isn't loaded — safe to insert
 * unconditionally via `dangerouslySetInnerHTML`.
 */
export async function nrBrowserTimingHeader(): Promise<string> {
  const agent = await loadAgent();
  if (!agent) return "";
  try {
    // `hasToRemoveScriptWrapper: true` returns just the JS, no <script>
    // tags — we control wrapping ourselves in the React component so the
    // CSP nonce can be applied if the project later enables CSP.
    return agent.getBrowserTimingHeader({ hasToRemoveScriptWrapper: true }) ?? "";
  } catch {
    return "";
  }
}

// --- test-only --------------------------------------------------------------
/** Force the next call to re-resolve the agent. Used by Vitest only. */
export function __resetNewRelicForTests(): void {
  agentCache = undefined;
  agentPromise = undefined;
}
