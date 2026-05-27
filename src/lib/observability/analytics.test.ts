import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GaEvent,
  readStashedCheckout,
  stashCheckoutForPurchase,
  trackAddToCart,
  trackApplyCoupon,
  trackBeginCheckout,
  trackGaEvent,
  trackLogin,
  trackPurchase,
  trackSearch,
  trackSignup,
} from "@/lib/observability/analytics";

vi.mock("@/lib/observability/env", () => ({
  isGoogleAnalyticsEnabled: vi.fn(() => true),
}));

// Capture the NR Browser bridge so we can assert each GA4 call also fires
// the matching PageAction. Default to a vi.fn that the helper module
// re-exports under the same name.
const nrBrowserAddPageAction = vi.fn();
vi.mock("@/lib/observability/newrelic-browser", () => ({
  nrBrowserAddPageAction: (...args: unknown[]) =>
    nrBrowserAddPageAction(...args),
}));

const product = {
  id: "p1",
  name: "Essential Crew Tee",
  priceCents: 3499,
  currency: "usd",
  category: "Tops",
  brand: "YCompany",
};

describe("analytics", () => {
  beforeEach(() => {
    sessionStorage.clear();
    nrBrowserAddPageAction.mockClear();
  });

  afterEach(() => {
    delete window.gtag;
  });

  it("no-ops when gtag is missing", () => {
    expect(() => trackGaEvent("test_event")).not.toThrow();
  });

  it("fires add_to_cart with GA4 item payload", () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    trackAddToCart(product, 2);

    expect(gtag).toHaveBeenCalledWith("event", GaEvent.ADD_TO_CART, {
      currency: "USD",
      value: 69.98,
      items: [
        expect.objectContaining({
          item_id: "p1",
          item_name: "Essential Crew Tee",
          quantity: 2,
        }),
      ],
    });
  });

  it("fires begin_checkout and purchase", () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    trackBeginCheckout({
      currency: "usd",
      valueCents: 7498,
      items: [{ item_id: "p1", item_name: "Tee", price: 34.99, quantity: 2 }],
      coupon: "WELCOME10",
    });

    trackPurchase({ transactionId: "cs_test", currency: "usd", valueCents: 7498 });

    expect(gtag).toHaveBeenCalledWith(
      "event",
      GaEvent.BEGIN_CHECKOUT,
      expect.objectContaining({ coupon: "WELCOME10", value: 74.98 }),
    );
    expect(gtag).toHaveBeenCalledWith(
      "event",
      GaEvent.PURCHASE,
      expect.objectContaining({ transaction_id: "cs_test", value: 74.98 }),
    );
  });

  it("skips empty search terms", () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    trackSearch("   ");
    expect(gtag).not.toHaveBeenCalled();

    trackSearch("sweater");
    expect(gtag).toHaveBeenCalledWith("event", GaEvent.SEARCH, {
      search_term: "sweater",
    });
  });

  it("tracks login and coupon apply", () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    trackLogin("google");
    trackApplyCoupon("SAVE20", 2000, false);

    expect(gtag).toHaveBeenCalledWith("event", GaEvent.LOGIN, { method: "google" });
    expect(gtag).toHaveBeenCalledWith("event", GaEvent.APPLY_COUPON, {
      coupon: "SAVE20",
      discount: 20,
      free_shipping: false,
    });
  });

  it("stashes and reads checkout totals for purchase", () => {
    stashCheckoutForPurchase({ currency: "usd", valueCents: 5000 });
    expect(readStashedCheckout()).toEqual({ currency: "usd", valueCents: 5000 });
    expect(readStashedCheckout()).toBeNull();
  });

  // --- NR Browser bridge -------------------------------------------------
  describe("New Relic Browser bridge", () => {
    it("forwards GA4 events to NR with the PascalCase action name", () => {
      window.gtag = vi.fn();
      trackLogin("google");
      expect(nrBrowserAddPageAction).toHaveBeenCalledWith("Login", {
        method: "google",
      });
    });

    it("flattens items[] arrays into scalar NR attributes", () => {
      window.gtag = vi.fn();
      trackAddToCart(product, 2);
      const [name, attrs] = nrBrowserAddPageAction.mock.calls[0];
      expect(name).toBe("AddToCart");
      expect(attrs).toMatchObject({
        currency: "USD",
        value: 69.98,
        items_count: 1,
        item_ids: "p1",
        total_quantity: 2,
      });
      expect(attrs.items).toBeUndefined();
    });

    it("fires NR action even when GA4 is not configured", async () => {
      const env = await import("@/lib/observability/env");
      vi.mocked(env.isGoogleAnalyticsEnabled).mockReturnValue(false);
      trackSearch("sweater");
      expect(nrBrowserAddPageAction).toHaveBeenCalledWith("Search", {
        search_term: "sweater",
      });
      vi.mocked(env.isGoogleAnalyticsEnabled).mockReturnValue(true);
    });

    it("trackSignup fires under the Signup NR name", () => {
      window.gtag = vi.fn();
      trackSignup("credentials");
      expect(nrBrowserAddPageAction).toHaveBeenCalledWith("Signup", {
        method: "credentials",
      });
    });
  });
});
