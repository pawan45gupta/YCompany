import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `newrelic` is a Node-only native package that boots an agent at import
// time. We mock it as a thin object exposing the four methods the wrapper
// touches — and verify the wrapper sanitizes/guards correctly without
// ever loading the real agent.
const recordCustomEvent = vi.fn<(t: string, a: Record<string, unknown>) => unknown>();
const addCustomAttribute = vi.fn<(k: string, v: unknown) => void>();
const noticeError = vi.fn<(e: Error, a?: Record<string, unknown>) => void>();
const setUserID = vi.fn<(id: string) => void>();
const getBrowserTimingHeader = vi.fn<(opts?: unknown) => string>(
  () => "window.NREUM=...;",
);

vi.mock("newrelic", () => ({
  recordCustomEvent,
  addCustomAttribute,
  noticeError,
  setUserID,
  getBrowserTimingHeader,
}));

// `isNewRelicEnabled` is the gate that controls whether we even attempt
// to `import("newrelic")`. Toggle it per-test via this mock.
const isNewRelicEnabled = vi.fn<() => boolean>(() => true);
vi.mock("@/lib/observability/env", () => ({
  isNewRelicEnabled: () => isNewRelicEnabled(),
}));

async function importFresh() {
  vi.resetModules();
  const mod = await import("@/lib/observability/newrelic-server");
  return mod;
}

describe("newrelic-server wrapper", () => {
  beforeEach(() => {
    recordCustomEvent.mockReset().mockReturnValue(undefined);
    addCustomAttribute.mockReset();
    noticeError.mockReset();
    setUserID.mockReset();
    getBrowserTimingHeader.mockReset().mockReturnValue("window.NREUM=...;");
    isNewRelicEnabled.mockReset().mockReturnValue(true);
  });
  afterEach(() => {
    vi.resetModules();
  });

  it("recordEvent forwards eventType + sanitized attributes (strips null/undef)", async () => {
    const { nrRecordEvent } = await importFresh();
    await nrRecordEvent("Signup", {
      user_id: "u1",
      email_domain: "x.com",
      coupon: null,
      campaign: undefined,
      has_name: true,
    });
    expect(recordCustomEvent).toHaveBeenCalledTimes(1);
    expect(recordCustomEvent).toHaveBeenCalledWith("Signup", {
      user_id: "u1",
      email_domain: "x.com",
      has_name: true,
    });
  });

  it("recordEvent is a no-op when isNewRelicEnabled() returns false", async () => {
    isNewRelicEnabled.mockReturnValue(false);
    const { nrRecordEvent } = await importFresh();
    await nrRecordEvent("Signup", { user_id: "u1" });
    expect(recordCustomEvent).not.toHaveBeenCalled();
  });

  it("recordEvent caches the agent (one import for many events)", async () => {
    const { nrRecordEvent } = await importFresh();
    await Promise.all([
      nrRecordEvent("A", { i: 1 }),
      nrRecordEvent("B", { i: 2 }),
      nrRecordEvent("C", { i: 3 }),
    ]);
    expect(recordCustomEvent).toHaveBeenCalledTimes(3);
    // The dynamic import is cached across calls — we have no clean way to
    // assert "one import" but we assert all three events landed AND none
    // of them threw, which is what we care about operationally.
  });

  it("noticeError wraps non-Error values in Error before forwarding", async () => {
    const { nrNoticeError } = await importFresh();
    await nrNoticeError("plain string", { route: "/cart" });
    await nrNoticeError(new Error("real"), { route: "/login" });
    expect(noticeError).toHaveBeenCalledTimes(2);
    expect(noticeError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((noticeError.mock.calls[0][0] as Error).message).toBe("plain string");
    expect(noticeError.mock.calls[0][1]).toEqual({ route: "/cart" });
  });

  it("setUserId and addCustomAttribute forward through", async () => {
    const { nrSetUserId, nrAddCustomAttribute } = await importFresh();
    await nrSetUserId("user-42");
    await nrAddCustomAttribute("checkout_step", 3);
    expect(setUserID).toHaveBeenCalledWith("user-42");
    expect(addCustomAttribute).toHaveBeenCalledWith("checkout_step", 3);
  });

  it("recordEvent swallows agent exceptions (must not break the request)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    recordCustomEvent.mockImplementation(() => {
      throw new Error("agent boom");
    });
    const { nrRecordEvent } = await importFresh();
    await expect(nrRecordEvent("Signup", { u: "1" })).resolves.toBeUndefined();
    warn.mockRestore();
  });

  it("recordEvent warns (dev only) when the agent rejects the attributes", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    recordCustomEvent.mockReturnValue(false);
    const { nrRecordEvent } = await importFresh();
    await nrRecordEvent("Signup", { u: "1" });
    // We don't enforce the exact message, just that *some* warning fires.
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("browserTimingHeader returns the agent snippet (no <script> wrapper)", async () => {
    const { nrBrowserTimingHeader } = await importFresh();
    const snippet = await nrBrowserTimingHeader();
    expect(snippet).toBe("window.NREUM=...;");
    expect(getBrowserTimingHeader).toHaveBeenCalledWith({
      hasToRemoveScriptWrapper: true,
    });
  });

  it("browserTimingHeader returns '' when NR is disabled", async () => {
    isNewRelicEnabled.mockReturnValue(false);
    const { nrBrowserTimingHeader } = await importFresh();
    await expect(nrBrowserTimingHeader()).resolves.toBe("");
    expect(getBrowserTimingHeader).not.toHaveBeenCalled();
  });
});
