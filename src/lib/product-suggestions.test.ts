import { describe, expect, it } from "vitest";
import { getProductSuggestions } from "@/lib/product-suggestions";

describe("getProductSuggestions", () => {
  it("returns nothing for very short queries", () => {
    expect(getProductSuggestions("a")).toEqual([]);
    expect(getProductSuggestions("  ")).toEqual([]);
  });

  it("returns matching products by name", () => {
    const results = getProductSuggestions("Essential");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toContain("Essential");
  });

  it("respects the limit", () => {
    const results = getProductSuggestions("e", 8, 1);
    expect(results.length).toBeLessThanOrEqual(8);
  });
});
