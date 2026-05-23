import type { Product } from "@/types/product";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

const LOW_STOCK_THRESHOLD = 5;

export function getStock(product: Product): number {
  return product.stock;
}

export function getStockStatus(product: Product): StockStatus {
  const stock = getStock(product);
  if (stock <= 0) return "out_of_stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

export function canFulfillQuantity(product: Product, quantity: number): boolean {
  return quantity > 0 && quantity <= getStock(product);
}

export function clampAddQuantity(
  product: Product,
  currentQty: number,
  addQty: number,
): number {
  const available = Math.max(0, getStock(product) - currentQty);
  return Math.min(addQty, available);
}
