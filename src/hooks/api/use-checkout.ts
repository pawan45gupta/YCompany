"use client";

import { getApiErrorMessage } from "@/lib/api/client";
import type { CheckoutPayload, CheckoutResponse } from "@/lib/api/types";
import { useApiMutation } from "@/hooks/api/use-api-mutation";
import { useTranslation } from "@/i18n/client";

export function useCheckout() {
  const { t } = useTranslation();

  const mutation = useApiMutation<CheckoutResponse, CheckoutPayload>(
    {
      path: "/api/checkout",
      method: "POST",
      getBody: (payload) => payload,
    },
  );

  const startCheckout = async (payload: CheckoutPayload) => {
    const data = await mutation.mutateAsync(payload);
    if (!data.url) {
      throw new Error(t("checkout.failed"));
    }
    window.location.href = data.url;
    return data;
  };

  const errorMessage = mutation.error
    ? getApiErrorMessage(
        mutation.error,
        mutation.error.status === 0 ? t("common.networkError") : t("checkout.failed"),
      )
    : null;

  return {
    ...mutation,
    startCheckout,
    errorMessage,
  };
}
