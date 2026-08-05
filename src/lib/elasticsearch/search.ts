import type { QueryDslQueryContainer, Sort } from "@elastic/elasticsearch/lib/api/types";
import type { Product, ProductFilters } from "@/types/product";
import {
  getElasticsearchClient,
  getElasticsearchIndex,
} from "@/lib/elasticsearch/client";

const SEARCH_FIELDS = [
  "name^3",
  "brand^2",
  "material^2",
  "tags",
  "description",
  "category",
  "sku",
] as const;

/** Keyword fields used for substring / prefix match (mirrors in-memory haystack). */
const KEYWORD_SUBSTRING_FIELDS = [
  "name.keyword",
  "brand.keyword",
  "material.keyword",
  "category.keyword",
  "sku.keyword",
  "tags.keyword",
] as const;

function buildSort(filters: ProductFilters): Sort {
  const sort = filters.sort ?? "relevance";
  if (sort === "price-asc") return [{ priceCents: { order: "asc" } }];
  if (sort === "price-desc") return [{ priceCents: { order: "desc" } }];
  if (sort === "name") return [{ "name.keyword": { order: "asc" } }];
  return [{ _score: { order: "desc" } }, { "name.keyword": { order: "asc" } }];
}

/** Escape Lucene wildcard special characters in user input. */
function escapeWildcard(value: string): string {
  return value.replace(/[\\*?+\-()[\]{}^~|&!:/]/g, "\\$&");
}

function buildQuery(filters: ProductFilters): QueryDslQueryContainer {
  const filter: QueryDslQueryContainer[] = [];

  if (filters.brands?.length) {
    filter.push({ terms: { "brand.keyword": filters.brands } });
  }

  if (filters.minPriceCents != null || filters.maxPriceCents != null) {
    const range: { gte?: number; lte?: number } = {};
    if (filters.minPriceCents != null) range.gte = filters.minPriceCents;
    if (filters.maxPriceCents != null) range.lte = filters.maxPriceCents;
    filter.push({ range: { priceCents: range } });
  }

  const q = filters.query?.trim();
  if (!q) {
    return {
      bool: {
        filter,
        must: [{ match_all: {} }],
      },
    };
  }

  const wildcard = `*${escapeWildcard(q.toLowerCase())}*`;

  // Combine full-word match + search-as-you-type + substring wildcards so
  // partial typing ("mole", "Heri", "Essent") still finds product names —
  // matching the previous in-memory haystack.includes(q) behaviour.
  return {
    bool: {
      filter,
      should: [
        {
          multi_match: {
            query: q,
            fields: [...SEARCH_FIELDS],
            type: "best_fields",
            fuzziness: "AUTO",
            operator: "and",
            boost: 3,
          },
        },
        {
          multi_match: {
            query: q,
            fields: [...SEARCH_FIELDS],
            type: "bool_prefix",
            operator: "and",
            boost: 2,
          },
        },
        {
          multi_match: {
            query: q,
            fields: [...SEARCH_FIELDS],
            type: "phrase_prefix",
            boost: 2,
          },
        },
        {
          bool: {
            should: KEYWORD_SUBSTRING_FIELDS.map((field) => ({
              wildcard: {
                [field]: {
                  value: wildcard,
                  case_insensitive: true,
                  boost: field.startsWith("name") ? 2 : 1,
                },
              },
            })),
            minimum_should_match: 1,
          },
        },
      ],
      minimum_should_match: 1,
    },
  };
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function hitToProduct(source: Record<string, unknown>): Product {
  return {
    id: asString(source.id),
    slug: asString(source.slug),
    name: asString(source.name),
    description: asString(source.description),
    priceCents: asNumber(source.priceCents),
    currency: asString(source.currency, "USD"),
    brand: asString(source.brand),
    category: asString(source.category),
    tags: Array.isArray(source.tags)
      ? source.tags.filter((t): t is string => typeof t === "string")
      : [],
    image: asString(source.image),
    stock: asNumber(source.stock),
    sku: asString(source.sku),
    material:
      typeof source.material === "string" ? source.material : undefined,
  };
}

/** Run a catalog search against Elastic Cloud. Throws on transport / query errors. */
export async function searchElasticsearch(
  filters: ProductFilters,
): Promise<Product[]> {
  const client = getElasticsearchClient();
  const index = getElasticsearchIndex();

  const response = await client.search({
    index,
    size: 100,
    query: buildQuery(filters),
    sort: buildSort(filters),
  });

  return (response.hits.hits ?? [])
    .map((hit) => hit._source as Record<string, unknown> | undefined)
    .filter((source): source is Record<string, unknown> => source != null)
    .map(hitToProduct);
}
