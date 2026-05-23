import type { Product } from "@/types/product";

export type ProductInput = Omit<Product, "stock" | "sku"> & {
  stock?: number;
  sku?: string;
  material?: string;
};

/** Applies default RMS fields for catalog entries. */
export function enrichProduct(input: ProductInput): Product {
  return {
    ...input,
    stock: input.stock ?? 24,
    sku: input.sku ?? `YC-${input.id.toUpperCase()}`,
    material: input.material,
  };
}
