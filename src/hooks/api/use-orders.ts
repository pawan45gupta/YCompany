"use client";

import { useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { CancelOrderResponse, OrdersResponse } from "@/lib/api/types";
import { useApiMutation } from "@/hooks/api/use-api-mutation";
import { useApiQuery } from "@/hooks/api/use-api-query";
import { useTranslation } from "@/i18n/client";
import type { Order } from "@/types/order";

export function useOrders() {
  const { t } = useTranslation();

  const query = useApiQuery<OrdersResponse>("/api/orders", {
    queryKey: queryKeys.orders.list(),
  });

  return {
    ...query,
    orders: query.data?.orders ?? [],
    errorMessage: query.error
      ? getApiErrorMessage(query.error, t("account.loadFailed"))
      : null,
  };
}

export function useCancelOrder() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const mutation = useApiMutation<CancelOrderResponse, { orderId: string }>(
    {
      path: ({ orderId }) => `/api/orders/${orderId}/cancel`,
      method: "POST",
    },
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      },
    },
  );

  return {
    ...mutation,
    errorMessage: mutation.error
      ? getApiErrorMessage(mutation.error, t("account.cancelFailed"))
      : null,
    cancelOrder: mutation.mutateAsync,
  };
}

export type { Order };
