export const queryKeys = {
  orders: {
    all: ["orders"] as const,
    list: () => [...queryKeys.orders.all, "list"] as const,
  },
  search: {
    all: ["search"] as const,
    query: (params: Record<string, string | undefined>) =>
      [...queryKeys.search.all, params] as const,
  },
} as const;
