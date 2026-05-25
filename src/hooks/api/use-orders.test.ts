import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCancelOrder, useOrders } from "@/hooks/api/use-orders";
import { ApiError, apiRequest } from "@/lib/api/client";
import { createHookWrapper } from "@/test/test-utils";
import type { Order } from "@/types/order";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

const sampleOrder: Order = {
  id: "ord_test",
  userId: "u1",
  customerEmail: "jane@example.com",
  status: "processing",
  lines: [
    {
      productId: "p1",
      name: "Tee",
      quantity: 1,
      unitPriceCents: 3499,
    },
  ],
  subtotalCents: 3499,
  shippingCents: 0,
  discountCents: 0,
  totalCents: 3499,
  currency: "usd",
  placedAt: "2024-06-01T12:00:00.000Z",
};

describe("useOrders", () => {
  it("returns orders and null error on success", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ orders: [sampleOrder] });

    const { result } = renderHook(() => useOrders(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.orders).toEqual([sampleOrder]);
    expect(result.current.errorMessage).toBeNull();
  });

  it("maps api errors to errorMessage", async () => {
    vi.mocked(apiRequest).mockRejectedValue(new ApiError("fail", 500, null));

    const { result } = renderHook(() => useOrders(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.orders).toEqual([]);
    expect(result.current.errorMessage).toBeTruthy();
  });
});

describe("useCancelOrder", () => {
  it("cancels order and exposes errorMessage on failure", async () => {
    vi.mocked(apiRequest).mockRejectedValue(new ApiError("fail", 400, null));

    const { result } = renderHook(() => useCancelOrder(), {
      wrapper: createHookWrapper(),
    });

    await expect(
      result.current.cancelOrder({ orderId: "ord_test" }),
    ).rejects.toThrow();

    await waitFor(() => expect(result.current.errorMessage).toBeTruthy());
  });

  it("calls cancel endpoint on success", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ order: sampleOrder });

    const { result } = renderHook(() => useCancelOrder(), {
      wrapper: createHookWrapper(),
    });

    await result.current.cancelOrder({ orderId: "ord_test" });

    expect(apiRequest).toHaveBeenCalledWith("/api/orders/ord_test/cancel", {
      method: "POST",
      body: undefined,
    });
  });
});
