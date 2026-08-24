"use client";

import { CartQuantityStepper } from "@/components/CartQuantityStepper";

export function AddToCartButton({ productId }: { productId: string }) {
  return <CartQuantityStepper productId={productId} size="large" />;
}
