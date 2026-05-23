"use client";

import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiRequest, type ApiError } from "@/lib/api/client";

export type UseApiQueryOptions<TData> = Omit<
  UseQueryOptions<TData, ApiError>,
  "queryKey" | "queryFn"
> & {
  queryKey?: QueryKey;
  params?: Record<string, string | number | boolean | undefined | null>;
  method?: "GET" | "HEAD";
};

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Generic GET (or HEAD) hook backed by the shared fetch client. */
export function useApiQuery<TData>(
  path: string,
  options?: UseApiQueryOptions<TData>,
) {
  const { queryKey, params, method = "GET", ...queryOptions } = options ?? {};
  const url = buildUrl(path, params);
  const key = queryKey ?? [path, params ?? null];

  return useQuery<TData, ApiError>({
    queryKey: key,
    queryFn: () => apiRequest<TData>(url, { method }),
    ...queryOptions,
  });
}
