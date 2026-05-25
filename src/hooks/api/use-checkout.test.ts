import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCheckout } from "@/hooks/api/use-checkout";
import { ApiError, apiRequest } from "@/lib/api/client";
import { createHookWrapper } from "@/test/test-utils";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/client")>();
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

describe("useCheckout", () => {
  it("redirects to stripe url on success", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ url: "https://checkout.stripe.test" });
    let href = "http://localhost/";
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        get href() {
          return href;
        },
        set href(next: string) {
          href = next;
        },
      },
    });

    const { result } = renderHook(() => useCheckout(), {
      wrapper: createHookWrapper(),
    });

    await result.current.startCheckout({
      items: [{ productId: "p1", quantity: 1 }],
    });

    expect(href).toBe("https://checkout.stripe.test");
  });

  it("throws when checkout url is missing", async () => {
    vi.mocked(apiRequest).mockResolvedValue({});

    const { result } = renderHook(() => useCheckout(), {
      wrapper: createHookWrapper(),
    });

    await expect(
      result.current.startCheckout({ items: [{ productId: "p1", quantity: 1 }] }),
    ).rejects.toThrow();
  });

  it("exposes checkout failed message for server errors", async () => {
    vi.mocked(apiRequest).mockRejectedValue(new ApiError("server", 500, null));

    const { result } = renderHook(() => useCheckout(), {
      wrapper: createHookWrapper(),
    });

    await expect(
      result.current.mutateAsync({ items: [{ productId: "p1", quantity: 1 }] }),
    ).rejects.toThrow();

    await waitFor(() => expect(result.current.errorMessage).toBeTruthy());
  });

  it("exposes network error message for status 0", async () => {
    vi.mocked(apiRequest).mockRejectedValue(new ApiError("network", 0, null));

    const { result } = renderHook(() => useCheckout(), {
      wrapper: createHookWrapper(),
    });

    await expect(
      result.current.mutateAsync({ items: [{ productId: "p1", quantity: 1 }] }),
    ).rejects.toThrow();

    await waitFor(() =>
      expect(result.current.errorMessage).toMatch(/network|failed/i),
    );
  });
});
