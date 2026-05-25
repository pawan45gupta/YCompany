"use client";

import { useEffect } from "react";
import type { Product } from "@/types/product";
import { trackViewItem } from "@/lib/observability/analytics";

type Props = {
  product: Pick<Product, "id" | "name" | "priceCents" | "currency" | "category" | "brand">;
};

/** Fires GA4 view_item once when a product detail page mounts. */
export function ProductViewTracker({ product }: Props) {
  useEffect(() => {
    trackViewItem(product);
  }, [product]);

  return null;
}
