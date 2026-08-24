import { describe, expect, it } from "vitest";
import { products } from "@/data/products";
import {
  getBrandFacetCounts,
  getBrandProductCounts,
  getCatalogPriceBounds,
} from "@/lib/product-filters";

describe("getBrandFacetCounts", () => {
  it("matches full-catalog counts when no filters are active", () => {
    const full = getBrandProductCounts();
    const facets = getBrandFacetCounts(products, {});
    expect(facets).toEqual(full);
  });

  it("updates brand counts when a price range is applied", () => {
    const bounds = getCatalogPriceBounds();
    const facets = getBrandFacetCounts(products, {
      minPriceCents: bounds.min,
      maxPriceCents: bounds.min + 1000,
    });

    const full = getBrandProductCounts();
    const totalInRange = Object.values(facets).reduce((sum, n) => sum + n, 0);
    const totalCatalog = Object.values(full).reduce((sum, n) => sum + n, 0);

    expect(totalInRange).toBeLessThan(totalCatalog);
    expect(totalInRange).toBeGreaterThan(0);
  });

  it("ignores selected brands so counts reflect other active filters", () => {
    const withBrand = getBrandFacetCounts(products, { brands: ["YCompany"] });
    const withoutBrand = getBrandFacetCounts(products, {});

    expect(withBrand).toEqual(withoutBrand);
  });
});
