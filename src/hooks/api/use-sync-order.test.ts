import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSyncOrder } from "@/hooks/api/use-sync-order";
import { apiRequest } from "@/lib/api/client";
import { createHookWrapper } from "@/test/test-utils";

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    data: unknown;
    constructor(message: string, status: number, data: unknown) {
      super(message);
      this.status = status;
      this.data = data;
    }
  },
  getApiErrorMessage: (e: Error) => e.message,
}));

describe("useSyncOrder", () => {
  it("posts session id to sync endpoint", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useSyncOrder(), {
      wrapper: createHookWrapper(),
    });

    await result.current.mutateAsync({ sessionId: "cs_test_123" });

    expect(apiRequest).toHaveBeenCalledWith("/api/orders/sync", {
      method: "POST",
      body: { sessionId: "cs_test_123" },
    });
  });
});
