import { products } from "@/data/products";
import { searchCatalog, getCatalogIndex } from "@/lib/search-index";
import type { Product, ProductFilters, ProductSort } from "@/types/product";

export function getCatalogBrands(): string[] {
  return [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b));
}

export function getCatalogPriceBounds(): { min: number; max: number } {
  const prices = products.map((p) => p.priceCents);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function filterProducts(
  items: readonly Product[],
  filters: ProductFilters,
): Product[] {
  return searchCatalog(items, filters);
}

export function getBrandProductCounts(
  items: readonly Product[] = products,
): Readonly<Record<string, number>> {
  return getCatalogIndex(items).brandCounts;
}

/** Brand counts for the current query/price context (ignores selected brands). */
export function getBrandFacetCounts(
  items: readonly Product[],
  filters: ProductFilters,
): Readonly<Record<string, number>> {
  const { brands: _brands, ...facetFilters } = filters;
  const matching = searchCatalog(items, facetFilters);
  const counts: Record<string, number> = {};
  for (const product of matching) {
    counts[product.brand] = (counts[product.brand] ?? 0) + 1;
  }
  return counts;
}

export function sortProducts(
  items: Product[],
  sort: ProductSort,
  query?: string,
): Product[] {
  const sorted = [...items];
  if (sort === "price-asc") {
    return sorted.sort((a, b) => a.priceCents - b.priceCents);
  }
  if (sort === "price-desc") {
    return sorted.sort((a, b) => b.priceCents - a.priceCents);
  }
  if (sort === "name") {
    return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  if (query) {
    const q = query.toLowerCase();
    return sorted.sort((a, b) => scoreMatch(b, q) - scoreMatch(a, q));
  }
  return sorted;
}

function scoreMatch(product: Product, q: string): number {
  const name = product.name.toLowerCase();
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  if (name.includes(q)) return 60;
  if (product.brand.toLowerCase().includes(q)) return 40;
  return 10;
}

export function formatPrice(cents: number, currency = "USD"): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

export type SearchParamsInput = {
  q?: string | null;
  brands?: string | null;
  min?: string | null;
  max?: string | null;
  sort?: string | null;
};

export function parseFiltersFromSearchParams(
  params: SearchParamsInput,
  bounds = getCatalogPriceBounds(),
): ProductFilters {
  const brands = params.brands
    ?.split(",")
    .map((b) => b.trim())
    .filter(Boolean);
  const validBrands = new Set(getCatalogBrands());
  const minRaw = params.min ? Number.parseInt(params.min, 10) : undefined;
  const maxRaw = params.max ? Number.parseInt(params.max, 10) : undefined;
  const minPriceCents =
    minRaw != null && !Number.isNaN(minRaw)
      ? Math.max(bounds.min, Math.min(minRaw, bounds.max))
      : undefined;
  const maxPriceCents =
    maxRaw != null && !Number.isNaN(maxRaw)
      ? Math.min(bounds.max, Math.max(maxRaw, bounds.min))
      : undefined;

  const sortValues: ProductSort[] = ["relevance", "price-asc", "price-desc", "name"];
  const sort = sortValues.includes(params.sort as ProductSort)
    ? (params.sort as ProductSort)
    : "relevance";

  return {
    query: params.q?.trim() || undefined,
    brands: brands?.filter((b) => validBrands.has(b)),
    minPriceCents:
      minPriceCents != null && minPriceCents > bounds.min ? minPriceCents : undefined,
    maxPriceCents:
      maxPriceCents != null && maxPriceCents < bounds.max ? maxPriceCents : undefined,
    sort: sort === "relevance" ? undefined : sort,
  };
}

export function buildSearchQueryString(filters: ProductFilters, bounds = getCatalogPriceBounds()): string {
  const sp = new URLSearchParams();
  if (filters.query) sp.set("q", filters.query);
  if (filters.brands?.length) sp.set("brands", filters.brands.join(","));
  if (filters.minPriceCents != null && filters.minPriceCents > bounds.min) {
    sp.set("min", String(filters.minPriceCents));
  }
  if (filters.maxPriceCents != null && filters.maxPriceCents < bounds.max) {
    sp.set("max", String(filters.maxPriceCents));
  }
  if (filters.sort && filters.sort !== "relevance") sp.set("sort", filters.sort);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function countActiveFilters(filters: ProductFilters, bounds = getCatalogPriceBounds()): number {
  let n = 0;
  if (filters.brands?.length) n += 1;
  if (filters.minPriceCents != null && filters.minPriceCents > bounds.min) n += 1;
  if (filters.maxPriceCents != null && filters.maxPriceCents < bounds.max) n += 1;
  return n;
}
