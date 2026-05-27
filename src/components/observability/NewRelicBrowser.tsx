import { nrBrowserTimingHeader } from "@/lib/observability/newrelic-server";

/**
 * Injects the New Relic Browser agent into the page <head>.
 *
 * Render this as the FIRST element inside <body> (or — preferably — in
 * <head>) so the agent boots before any user-interaction or AJAX call.
 * The snippet itself is generated per-request by the Node APM agent's
 * `getBrowserTimingHeader()`, which binds the browser-side instance to
 * the in-flight server transaction (giving you end-to-end distributed
 * tracing in the NR UI).
 *
 * Renders nothing when:
 *   - the Node agent isn't loaded (no NEW_RELIC_LICENSE_KEY), OR
 *   - browser monitoring is disabled in `newrelic.js`.
 *
 * Because this is an async Server Component, the snippet is generated on
 * the server during HTML streaming — no extra client roundtrip. The
 * `<script>` element it emits is safe to set via `dangerouslySetInnerHTML`
 * because the contents come from the trusted agent runtime, not user
 * input.
 */
export async function NewRelicBrowser() {
  const snippet = await nrBrowserTimingHeader();
  if (!snippet) return null;

  return (
    <script
      // id helps debugging in DevTools — search for it in Sources.
      id="nr-browser-agent"
      // The Node agent returns JS source (no <script> wrapper, because we
      // asked for `hasToRemoveScriptWrapper: true`). We re-wrap here so we
      // own the attributes (nonce, async, etc.) the React renderer emits.
      dangerouslySetInnerHTML={{ __html: snippet }}
    />
  );
}
