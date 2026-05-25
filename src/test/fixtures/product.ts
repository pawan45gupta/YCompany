import type { Product } from "@/types/product";

export const mockProduct: Product = {
  id: "p1",
  slug: "essential-crew-tee",
  name: "Essential Crew Tee",
  description: "Test product",
  priceCents: 3499,
  currency: "usd",
  brand: "YCompany",
  category: "Tops",
  tags: ["cotton"],
  image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
  stock: 24,
  sku: "YC-P1",
};

export const outOfStockProduct: Product = {
  ...mockProduct,
  id: "out-of-stock",
  slug: "out-of-stock",
  name: "Sold Out Tee",
  stock: 0,
};

export const lowStockProduct: Product = {
  ...mockProduct,
  id: "low-stock",
  slug: "low-stock",
  name: "Low Stock Tee",
  stock: 3,
};
