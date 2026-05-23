"use client";

import {
  useMutation,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { apiRequest, type ApiError } from "@/lib/api/client";

type PathResolver<TVariables> = string | ((variables: TVariables) => string);

export type UseApiMutationConfig<TVariables> = {
  path: PathResolver<TVariables>;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  /** When omitted, no request body is sent. */
  getBody?: (variables: TVariables) => unknown;
};

export type UseApiMutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, ApiError, TVariables>,
  "mutationFn"
>;

/** Generic mutation hook backed by the shared fetch client. */
export function useApiMutation<TData, TVariables = void>(
  config: UseApiMutationConfig<TVariables>,
  options?: UseApiMutationOptions<TData, TVariables>,
) {
  const { path, method = "POST", getBody } = config;

  return useMutation<TData, ApiError, TVariables>({
    mutationFn: (variables) => {
      const url = typeof path === "function" ? path(variables) : path;
      const body = getBody?.(variables);
      return apiRequest<TData>(url, { method, body });
    },
    ...options,
  });
}
