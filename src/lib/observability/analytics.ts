import { isGoogleAnalyticsEnabled } from "@/lib/observability/env";
import { nrBrowserAddPageAction } from "@/lib/observability/newrelic-browser";
import type { Product } from "@/types/product";

declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js",
      targetIdOrEventName: string | Date,
      params?: Record<string, string | number | boolean | object | undefined>,
    ) => void;
  }
}

/** GA4 recommended + app-specific event names. */
export const GaEvent = {
  ADD_TO_CART: "add_to_cart",
  REMOVE_FROM_CART: "remove_from_cart",
  BEGIN_CHECKOUT: "begin_checkout",
  PURCHASE: "purchase",
  SEARCH: "search",
  LOGIN: "login",
  SIGN_UP: "sign_up",
  VIEW_ITEM: "view_item",
  APPLY_COUPON: "apply_coupon",
  CANCEL_ORDER: "cancel_order",
} as const;

/**
 * Mapping from GA4 snake_case event names to the PascalCase form the New
 * Relic event store prefers. The same physical user action lands in two
 * places under two names, but they line up 1:1 — handy for cross-checking
 * funnel numbers between GA4 and NR.
 */
const GA_TO_NR_NAME: Record<string, string> = {
  add_to_cart: "AddToCart",
  remove_from_cart: "RemoveFromCart",
  begin_checkout: "BeginCheckout",
  purchase: "Purchase",
  search: "Search",
  login: "Login",
  sign_up: "Signup",
  view_item: "ViewItem",
  apply_coupon: "ApplyCoupon",
  cancel_order: "CancelOrder",
};

/**
 * NR Browser's `addPageAction` only accepts flat primitive attribute
 * values. Compress the GA4 `items[]` array into scalar columns so it
 * still flows through to NR Browser dashboards.
 */
function gaParamsToNrAttrs(
  params?: Record<string, string | number | boolean | object | undefined>,
): Record<string, string | number | boolean> {
  if (!params) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
      continue;
    }
    if (Array.isArray(v)) {
      out[`${k}_count`] = v.length;
      if (k === "items") {
        const items = v as GaItem[];
        out.item_ids = items.map((i) => i.item_id).join(",");
        out.item_names = items.map((i) => i.item_name).join(" | ");
        out.total_quantity = items.reduce((s, i) => s + (i.quantity ?? 0), 0);
      }
      continue;
    }
    try {
      out[k] = JSON.stringify(v);
    } catch {
      /* unstringifiable — skip */
    }
  }
  return out;
}

export type GaItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
  item_brand?: string;
};

function toGaItem(product: Pick<Product, "id" | "name" | "priceCents" | "category" | "brand">, quantity: number): GaItem {
  return {
    item_id: product.id,
    item_name: product.name,
    price: product.priceCents / 100,
    quantity,
    item_category: product.category,
    item_brand: product.brand,
  };
}

/**
 * Low-level event dispatcher — fans out to GA4 AND New Relic Browser, each
 * of which independently no-ops when its provider isn't loaded.
 *
 * Callers continue to use the same `trackGaEvent(...)` (or the named
 * helpers like `trackAddToCart`) — they don't need to think about NR.
 * Renaming this function would break callers, so we keep the GA4-flavoured
 * name and let `GA_TO_NR_NAME` map to NR's PascalCase convention.
 */
export function trackGaEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | object | undefined>,
): void {
  if (typeof window === "undefined") return;

  // 1) Google Analytics 4 — original path.
  if (isGoogleAnalyticsEnabled() && typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }

  // 2) New Relic Browser — runs whenever the agent loaded, regardless of
  //    whether GA4 is configured. The wrapper itself no-ops if the
  //    `window.newrelic` global isn't present yet (very early paint).
  const nrName = GA_TO_NR_NAME[eventName] ?? eventName;
  nrBrowserAddPageAction(nrName, gaParamsToNrAttrs(params));
}

export function trackAddToCart(
  product: Pick<Product, "id" | "name" | "priceCents" | "currency" | "category" | "brand">,
  quantity: number,
): void {
  trackGaEvent(GaEvent.ADD_TO_CART, {
    currency: product.currency.toUpperCase(),
    value: (product.priceCents * quantity) / 100,
    items: [toGaItem(product, quantity)],
  });
}

export function trackRemoveFromCart(
  product: Pick<Product, "id" | "name" | "priceCents" | "currency" | "category" | "brand">,
  quantity: number,
): void {
  trackGaEvent(GaEvent.REMOVE_FROM_CART, {
    currency: product.currency.toUpperCase(),
    value: (product.priceCents * quantity) / 100,
    items: [toGaItem(product, quantity)],
  });
}

export function trackViewItem(
  product: Pick<Product, "id" | "name" | "priceCents" | "currency" | "category" | "brand">,
): void {
  trackGaEvent(GaEvent.VIEW_ITEM, {
    currency: product.currency.toUpperCase(),
    value: product.priceCents / 100,
    items: [toGaItem(product, 1)],
  });
}

export function trackBeginCheckout(params: {
  currency: string;
  valueCents: number;
  items: GaItem[];
  coupon?: string;
}): void {
  trackGaEvent(GaEvent.BEGIN_CHECKOUT, {
    currency: params.currency.toUpperCase(),
    value: params.valueCents / 100,
    items: params.items,
    coupon: params.coupon,
  });
}

export function trackPurchase(params: {
  transactionId: string;
  currency?: string;
  valueCents?: number;
}): void {
  trackGaEvent(GaEvent.PURCHASE, {
    transaction_id: params.transactionId,
    currency: params.currency?.toUpperCase(),
    value: params.valueCents !== undefined ? params.valueCents / 100 : undefined,
  });
}

export function trackSearch(searchTerm: string): void {
  const term = searchTerm.trim();
  if (!term) return;
  trackGaEvent(GaEvent.SEARCH, { search_term: term });
}

export function trackLogin(method: string): void {
  trackGaEvent(GaEvent.LOGIN, { method });
}

export function trackSignup(method: string): void {
  trackGaEvent(GaEvent.SIGN_UP, { method });
}

export function trackApplyCoupon(code: string, discountCents: number, freeShipping: boolean): void {
  trackGaEvent(GaEvent.APPLY_COUPON, {
    coupon: code.toUpperCase(),
    discount: discountCents / 100,
    free_shipping: freeShipping,
  });
}

export function trackCancelOrder(orderId: string): void {
  trackGaEvent(GaEvent.CANCEL_ORDER, { order_id: orderId });
}

/** Persist checkout totals for purchase attribution after Stripe redirect. */
export function stashCheckoutForPurchase(totals: {
  currency: string;
  valueCents: number;
}): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      "ga_checkout",
      JSON.stringify({ currency: totals.currency, valueCents: totals.valueCents }),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export function readStashedCheckout(): { currency: string; valueCents: number } | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("ga_checkout");
    if (!raw) return null;
    sessionStorage.removeItem("ga_checkout");
    const parsed = JSON.parse(raw) as { currency?: string; valueCents?: number };
    if (typeof parsed.valueCents !== "number" || !parsed.currency) return null;
    return { currency: parsed.currency, valueCents: parsed.valueCents };
  } catch {
    return null;
  }
}

export function buildGaItemsFromCartRows(
  rows: {
    product: Pick<Product, "id" | "name" | "priceCents" | "category" | "brand">;
    quantity: number;
  }[],
): GaItem[] {
  return rows.map((row) => toGaItem(row.product, row.quantity));
}
