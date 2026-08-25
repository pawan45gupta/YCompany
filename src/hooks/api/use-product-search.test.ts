import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useProductSearch } from "@/hooks/api/use-product-search";
import { apiRequest } from "@/lib/api/client";
import { createHookWrapper } from "@/test/test-utils";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

describe("useProductSearch", () => {
  it("builds search params and exposes products from the response", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      products: [{ id: "p1", name: "Sweater" }],
      total: 1,
      source: "memory",
    });

    const { result } = renderHook(
      () =>
        useProductSearch({
          query: "sweater",
          brands: ["YCompany", "Heritage"],
          minPriceCents: 1000,
          maxPriceCents: 15000,
          sort: "price-asc",
        }),
      { wrapper: createHookWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiRequest).toHaveBeenCalledWith(
      "/api/products/search?q=sweater&brands=YCompany%2CHeritage&min=1000&max=15000&sort=price-asc",
      { method: "GET" },
    );
    expect(result.current.products).toEqual([{ id: "p1", name: "Sweater" }]);
    expect(result.current.total).toBe(1);
    expect(result.current.source).toBe("memory");
  });

  it("defaults to empty results before data arrives", () => {
    vi.mocked(apiRequest).mockResolvedValue({ products: [], total: 0 });

    const { result } = renderHook(
      () => useProductSearch({ query: "", sort: "relevance" }),
      { wrapper: createHookWrapper() },
    );

    expect(result.current.products).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.source).toBeUndefined();
  });
});
