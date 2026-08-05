import { beforeEach, describe, expect, it, vi } from "vitest";
import { products } from "@/data/products";
import { searchProducts } from "@/lib/search";

const isElasticsearchConfigured = vi.hoisted(() => vi.fn(() => false));
const searchElasticsearch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/elasticsearch/client", () => ({
  isElasticsearchConfigured: () => isElasticsearchConfigured(),
}));

vi.mock("@/lib/elasticsearch/search", () => ({
  searchElasticsearch: (...args: unknown[]) => searchElasticsearch(...args),
}));

describe("searchProducts facade", () => {
  beforeEach(() => {
    isElasticsearchConfigured.mockReset();
    searchElasticsearch.mockReset();
    isElasticsearchConfigured.mockReturnValue(false);
  });

  it("uses in-memory search when Elasticsearch is not configured", async () => {
    const result = await searchProducts({ query: "corduroy" });

    expect(result.source).toBe("memory");
    expect(result.products.length).toBeGreaterThan(0);
    expect(searchElasticsearch).not.toHaveBeenCalled();
  });

  it("finds signature materials via memory fallback", async () => {
    for (const query of ["corduroy", "moleskin", "tattersall", "sweater"]) {
      const result = await searchProducts({ query });
      expect(result.source).toBe("memory");
      expect(result.products.length).toBeGreaterThan(0);
    }
  });

  it("uses Elasticsearch when configured", async () => {
    isElasticsearchConfigured.mockReturnValue(true);
    const esProducts = products.slice(0, 2);
    searchElasticsearch.mockResolvedValue(esProducts);

    const result = await searchProducts({ query: "sweater" });

    expect(result.source).toBe("elasticsearch");
    expect(result.products).toEqual(esProducts);
    expect(searchElasticsearch).toHaveBeenCalledWith({ query: "sweater" });
  });

  it("falls back to memory when Elasticsearch throws", async () => {
    isElasticsearchConfigured.mockReturnValue(true);
    searchElasticsearch.mockRejectedValue(new Error("cluster down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await searchProducts({ query: "moleskin" });

    expect(result.source).toBe("memory");
    expect(result.products.length).toBeGreaterThan(0);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
