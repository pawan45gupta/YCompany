import type { IndicesIndexSettings, MappingTypeMapping } from "@elastic/elasticsearch/lib/api/types";

/** Index settings + mappings aligned with Product for filters, sort, and full-text. */
export const PRODUCT_INDEX_SETTINGS: IndicesIndexSettings = {
  number_of_shards: 1,
  number_of_replicas: 1,
};

export const PRODUCT_INDEX_MAPPINGS: MappingTypeMapping = {
  properties: {
    id: { type: "keyword" },
    slug: { type: "keyword" },
    name: {
      type: "text",
      fields: { keyword: { type: "keyword", ignore_above: 256 } },
    },
    description: { type: "text" },
    priceCents: { type: "integer" },
    currency: { type: "keyword" },
    brand: {
      type: "text",
      fields: { keyword: { type: "keyword" } },
    },
    category: {
      type: "text",
      fields: { keyword: { type: "keyword" } },
    },
    tags: {
      type: "text",
      fields: { keyword: { type: "keyword" } },
    },
    image: { type: "keyword", index: false },
    stock: { type: "integer" },
    sku: {
      type: "text",
      fields: { keyword: { type: "keyword" } },
    },
    material: {
      type: "text",
      fields: { keyword: { type: "keyword" } },
    },
  },
};
