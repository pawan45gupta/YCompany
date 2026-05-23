export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  brand: string;
  category: string;
  tags: string[];
  image: string;
  /** Retail inventory quantity (RMS). */
  stock: number;
  sku: string;
  /** Signature material e.g. moleskin, corduroy, merino. */
  material?: string;
};

export type ProductSort = "relevance" | "price-asc" | "price-desc" | "name";

export type ProductFilters = {
  query?: string;
  brands?: string[];
  minPriceCents?: number;
  maxPriceCents?: number;
  sort?: ProductSort;
};
