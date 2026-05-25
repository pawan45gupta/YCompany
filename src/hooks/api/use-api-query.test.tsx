import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { useApiQuery } from "@/hooks/api/use-api-query";
import { apiRequest } from "@/lib/api/client";
import { createTestQueryClient } from "@/test/test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
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

function wrapper(client = createTestQueryClient()) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("useApiQuery", () => {
  it("fetches data with default query key", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ ok: true });

    const { result } = renderHook(
      () => useApiQuery<{ ok: boolean }>("/api/test"),
      { wrapper: wrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiRequest).toHaveBeenCalledWith("/api/test", { method: "GET" });
    expect(result.current.data).toEqual({ ok: true });
  });

  it("appends query params to url", async () => {
    vi.mocked(apiRequest).mockResolvedValue([]);

    renderHook(
      () =>
        useApiQuery("/api/items", {
          params: { q: "hat", skip: null, all: true },
        }),
      { wrapper: wrapper() },
    );

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith("/api/items?q=hat&all=true", {
        method: "GET",
      }),
    );
  });

  it("respects custom query key and HEAD method", async () => {
    vi.mocked(apiRequest).mockResolvedValue(null);

    renderHook(
      () =>
        useApiQuery("/api/ping", {
          queryKey: ["ping"],
          method: "HEAD",
        }),
      { wrapper: wrapper() },
    );

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith("/api/ping", { method: "HEAD" }),
    );
  });
});
