import { products } from "@/data/products";
import { isElasticsearchConfigured } from "@/lib/elasticsearch/client";
import { searchElasticsearch } from "@/lib/elasticsearch/search";
import { searchCatalog } from "@/lib/search-index";
import type { Product, ProductFilters } from "@/types/product";

export type SearchSource = "elasticsearch" | "memory";

export type SearchResult = {
  products: Product[];
  source: SearchSource;
};

/**
 * Catalog search facade: Elastic Cloud when configured, otherwise (or on
 * error) the in-memory `searchCatalog` fallback.
 */
export async function searchProducts(
  filters: ProductFilters,
): Promise<SearchResult> {
  if (!isElasticsearchConfigured()) {
    return {
      products: searchCatalog(products, filters),
      source: "memory",
    };
  }

  try {
    const results = await searchElasticsearch(filters);
    return { products: results, source: "elasticsearch" };
  } catch (err) {
    console.error("[search] Elasticsearch failed; falling back to memory", err);
    return {
      products: searchCatalog(products, filters),
      source: "memory",
    };
  }
}
