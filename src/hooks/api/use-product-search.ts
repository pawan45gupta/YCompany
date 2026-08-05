"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/api/use-api-query";
import { queryKeys } from "@/lib/api/query-keys";
import type { SearchResponse } from "@/lib/api/types";
import type { ProductFilters } from "@/types/product";

export function useProductSearch(filters: ProductFilters) {
  const params: Record<string, string | undefined> = {};
  if (filters.query) params.q = filters.query;
  if (filters.brands?.length) params.brands = filters.brands.join(",");
  if (filters.minPriceCents != null) params.min = String(filters.minPriceCents);
  if (filters.maxPriceCents != null) params.max = String(filters.maxPriceCents);
  if (filters.sort && filters.sort !== "relevance") params.sort = filters.sort;

  const query = useApiQuery<SearchResponse>("/api/products/search", {
    queryKey: queryKeys.search.query(params),
    params,
    placeholderData: keepPreviousData,
  });

  return {
    ...query,
    products: query.data?.products ?? [],
    total: query.data?.total ?? 0,
    source: query.data?.source,
  };
}
