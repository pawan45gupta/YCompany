import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { CartProvider, useCart } from "@/context/CartContext";
import type { ReactNode } from "react";

const STORAGE_KEY = "ycompany-cart";

function wrapper({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

describe("CartContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("hydrates persisted cart from localStorage", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ productId: "p1", quantity: 2 }]),
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() =>
      expect(result.current.lines).toEqual([{ productId: "p1", quantity: 2 }]),
    );
  });

  it("ignores corrupt localStorage", async () => {
    localStorage.setItem(STORAGE_KEY, "not-json");

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.lines).toEqual([]));
  });

  it("adds, updates quantity, removes, and clears lines", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.add("p1", 1);
    });
    expect(result.current.lines).toEqual([{ productId: "p1", quantity: 1 }]);

    act(() => {
      result.current.setQty("p1", 2);
    });
    expect(result.current.lines[0].quantity).toBe(2);

    act(() => {
      result.current.remove("p1");
    });
    expect(result.current.lines).toEqual([]);

    act(() => {
      result.current.add("p1", 1);
      result.current.clear();
    });
    expect(result.current.lines).toEqual([]);
  });

  it("ignores unknown product ids", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.add("unknown", 1);
    });
    expect(result.current.lines).toEqual([]);
  });

  it("removes line when quantity set to zero", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.add("p1", 1);
      result.current.setQty("p1", 0);
    });
    expect(result.current.lines).toEqual([]);
  });

  it("caps quantity at available stock", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.add("p1", 1);
      result.current.setQty("p1", 999);
    });
    expect(result.current.lines[0]?.quantity).toBeGreaterThan(1);
    expect(result.current.lines[0]?.quantity).toBeLessThan(999);
  });

  it("does not increase quantity beyond stock", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.add("p1", 1000);
    });
    const qty = result.current.lines[0]?.quantity ?? 0;
    act(() => {
      result.current.add("p1", 5);
    });
    expect(result.current.lines[0]?.quantity).toBe(qty);
  });

  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useCart())).toThrow();
  });
});
