import { products } from "@/data/products";
import { searchCatalog } from "@/lib/search-index";
import type { Product } from "@/types/product";

export function getProductSuggestions(
  query: string,
  limit = 8,
  minChars = 2,
): Product[] {
  const trimmed = query.trim();
  if (trimmed.length < minChars) return [];

  return searchCatalog(products, { query: trimmed, sort: "relevance" }).slice(0, limit);
}
