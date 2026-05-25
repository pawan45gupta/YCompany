import { isGoogleAnalyticsEnabled } from "@/lib/observability/env";
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
  VIEW_ITEM: "view_item",
  APPLY_COUPON: "apply_coupon",
  CANCEL_ORDER: "cancel_order",
} as const;

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

/** Low-level GA4 event — no-ops when gtag or measurement ID is unavailable. */
export function trackGaEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | object | undefined>,
): void {
  if (typeof window === "undefined" || !isGoogleAnalyticsEnabled()) return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
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
