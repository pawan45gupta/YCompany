/**
 * Typed wrapper around the New Relic Browser agent's runtime API.
 *
 * The browser agent is injected at the top of <head> by the
 * `<NewRelicBrowser>` server component, which uses the Node agent's
 * `getBrowserTimingHeader()` to produce a per-transaction snippet. Once
 * loaded, the agent exposes itself as `window.newrelic.*`.
 *
 * Every export here is a *defensive* no-op when:
 *   - we're not in the browser, OR
 *   - the agent script hasn't loaded yet (e.g. first paint), OR
 *   - the agent is disabled (no NEW_RELIC_LICENSE_KEY on the server).
 *
 * Querying these events:
 *   FROM PageAction SELECT * WHERE actionName = 'AddToCart' SINCE 1 hour ago
 */

type NrPrimitive = string | number | boolean;
type NrAttrs = Record<string, NrPrimitive | null | undefined>;

declare global {
  interface Window {
    /**
     * Surface exposed by the NR Browser agent. We type only the small
     * subset we call — the full agent API is bigger but unused here.
     */
    newrelic?: {
      addPageAction: (name: string, attrs?: Record<string, NrPrimitive>) => void;
      setUserId: (userId: string | null) => void;
      setCustomAttribute: (
        name: string,
        value: NrPrimitive | null,
        persist?: boolean,
      ) => void;
      noticeError: (
        err: Error | string,
        customAttrs?: Record<string, NrPrimitive>,
      ) => void;
      setPageViewName: (name: string, host?: string) => void;
      interaction: () => { save: () => void; end: () => void };
    };
  }
}

function agent(): Window["newrelic"] | null {
  if (typeof window === "undefined") return null;
  return window.newrelic ?? null;
}

function sanitize(attrs: NrAttrs | undefined): Record<string, NrPrimitive> {
  if (!attrs) return {};
  const out: Record<string, NrPrimitive> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

/**
 * Record a custom page action — NR's browser-side equivalent of a custom
 * event. Use the same PascalCase action name as the server-side
 * `nrRecordEvent()` so dashboards stay consistent.
 */
export function nrBrowserAddPageAction(name: string, attrs?: NrAttrs): void {
  const nr = agent();
  if (!nr) return;
  try {
    nr.addPageAction(name, sanitize(attrs));
  } catch {
    /* swallow */
  }
}

/** Tag the current browser session with the authenticated user id. */
export function nrBrowserSetUserId(userId: string | null): void {
  const nr = agent();
  if (!nr) return;
  try {
    nr.setUserId(userId);
  } catch {
    /* swallow */
  }
}

/** Forward a handled client-side error to NR with optional attributes. */
export function nrBrowserNoticeError(err: unknown, attrs?: NrAttrs): void {
  const nr = agent();
  if (!nr) return;
  try {
    const realError =
      err instanceof Error
        ? err
        : new Error(typeof err === "string" ? err : "Non-Error thrown");
    nr.noticeError(realError, sanitize(attrs));
  } catch {
    /* swallow */
  }
}

/** Override the current pageview name (use sparingly, mainly for SPA routes). */
export function nrBrowserSetPageViewName(name: string): void {
  const nr = agent();
  if (!nr) return;
  try {
    nr.setPageViewName(name);
  } catch {
    /* swallow */
  }
}
