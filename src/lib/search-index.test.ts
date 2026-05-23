import { describe, expect, it } from "vitest";
import { products } from "@/data/products";
import { searchCatalog } from "@/lib/search-index";

describe("searchCatalog", () => {
  it("finds signature materials from the brief", () => {
    expect(searchCatalog(products, { query: "corduroy" }).length).toBeGreaterThan(0);
    expect(searchCatalog(products, { query: "moleskin" }).length).toBeGreaterThan(0);
    expect(searchCatalog(products, { query: "tattersall" }).length).toBeGreaterThan(0);
    expect(searchCatalog(products, { query: "sweater" }).length).toBeGreaterThan(0);
  });

  it("matches multi-token queries", () => {
    const results = searchCatalog(products, { query: "ycompany sweater" });
    expect(results.some((p) => p.brand === "YCompany")).toBe(true);
  });
});
