import type { Product, ProductFilters } from "@/types/product";
import { sortProducts } from "@/lib/product-filters";

type CatalogIndex = {
  products: readonly Product[];
  brandCounts: Readonly<Record<string, number>>;
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

function buildHaystack(product: Product): string {
  return [
    product.name,
    product.description,
    product.category,
    product.brand,
    product.material ?? "",
    product.tags.join(" "),
    product.sku,
  ]
    .join(" ")
    .toLowerCase();
}

function buildIndex(products: readonly Product[]): CatalogIndex {
  const brandCounts: Record<string, number> = {};
  for (const product of products) {
    brandCounts[product.brand] = (brandCounts[product.brand] ?? 0) + 1;
  }
  return { products, brandCounts };
}

let cachedIndex: CatalogIndex | null = null;

export function getCatalogIndex(products: readonly Product[]): CatalogIndex {
  if (!cachedIndex || cachedIndex.products !== products) {
    cachedIndex = buildIndex(products);
  }
  return cachedIndex;
}

/** Fast in-memory search with precomputed brand counts (scales to larger catalogs). */
export function searchCatalog(
  products: readonly Product[],
  filters: ProductFilters,
): Product[] {
  const q = filters.query?.trim().toLowerCase();
  const brands = filters.brands?.filter(Boolean);
  const tokens = q ? tokenize(q) : [];

  let list = products.filter((p) => {
    if (brands?.length && !brands.includes(p.brand)) return false;
    if (filters.minPriceCents != null && p.priceCents < filters.minPriceCents) return false;
    if (filters.maxPriceCents != null && p.priceCents > filters.maxPriceCents) return false;
    if (!q) return true;

    const hay = buildHaystack(p);
    if (hay.includes(q)) return true;
    return tokens.length > 0 && tokens.every((t) => hay.includes(t));
  });

  list = sortProducts(list, filters.sort ?? "relevance", q);
  return list;
}
