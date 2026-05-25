import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useApiMutation } from "@/hooks/api/use-api-mutation";
import { apiRequest } from "@/lib/api/client";
import { createTestQueryClient } from "@/test/test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

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
}));

function wrapper() {
  const client = createTestQueryClient();
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("useApiMutation", () => {
  it("posts with static path and body", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ id: "1" });

    const { result } = renderHook(
      () =>
        useApiMutation<{ id: string }, { name: string }>({
          path: "/api/items",
          method: "POST",
          getBody: (v) => v,
        }),
      { wrapper: wrapper() },
    );

    await result.current.mutateAsync({ name: "tee" });

    expect(apiRequest).toHaveBeenCalledWith("/api/items", {
      method: "POST",
      body: { name: "tee" },
    });
  });

  it("resolves dynamic path from variables", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ ok: true });

    const { result } = renderHook(
      () =>
        useApiMutation<{ ok: boolean }, { id: string }>({
          path: ({ id }) => `/api/items/${id}`,
          method: "DELETE",
        }),
      { wrapper: wrapper() },
    );

    await result.current.mutateAsync({ id: "42" });

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith("/api/items/42", {
        method: "DELETE",
        body: undefined,
      }),
    );
  });
});
