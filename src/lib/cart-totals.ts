import { products } from "@/data/products";
import { applyCoupon, type CouponResult } from "@/lib/coupons";

export const SHIPPING_CENTS = 599;

export type CartLineRow = {
  productId: string;
  quantity: number;
  product: (typeof products)[0];
  lineTotalCents: number;
};

export type CartTotals = {
  rows: CartLineRow[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  freeShipping: boolean;
  couponResult: CouponResult | null;
};

export function computeCartTotals(
  lines: { productId: string; quantity: number }[],
  couponCode: string,
): CartTotals {
  const byId = new Map(products.map((p) => [p.id, p]));
  const rows: CartLineRow[] = [];

  for (const line of lines) {
    const product = byId.get(line.productId);
    if (!product) continue;
    rows.push({
      productId: line.productId,
      quantity: line.quantity,
      product,
      lineTotalCents: product.priceCents * line.quantity,
    });
  }

  const subtotalCents = rows.reduce((s, r) => s + r.lineTotalCents, 0);
  const couponResult = couponCode.trim() ? applyCoupon(couponCode, subtotalCents) : null;
  const discountCents =
    couponResult?.valid === true ? couponResult.discountCents : 0;
  const freeShipping = couponResult?.valid === true ? couponResult.freeShipping : false;
  const shippingCents = freeShipping ? 0 : rows.length ? SHIPPING_CENTS : 0;
  const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents);

  return {
    rows,
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents,
    freeShipping,
    couponResult,
  };
}

export function formatMoney(cents: number, currency = "USD"): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
  });
}
