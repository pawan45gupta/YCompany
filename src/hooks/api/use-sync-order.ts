"use client";

import type { SyncOrderPayload } from "@/lib/api/types";
import { useApiMutation } from "@/hooks/api/use-api-mutation";

/** Fire-and-forget sync after Stripe redirect; errors are not surfaced in UI. */
export function useSyncOrder() {
  return useApiMutation<unknown, SyncOrderPayload>({
    path: "/api/orders/sync",
    method: "POST",
    getBody: (payload) => payload,
  });
}
