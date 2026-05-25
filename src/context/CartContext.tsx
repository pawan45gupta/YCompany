"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { products } from "@/data/products";
import { clampAddQuantity } from "@/lib/inventory";
import { trackAddToCart, trackRemoveFromCart } from "@/lib/observability/analytics";

export type CartLine = { productId: string; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  add: (productId: string, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "ycompany-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate persisted cart once on mount
          setLines(parsed);
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const add = useCallback((productId: string, qty = 1) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setLines((prev) => {
      const i = prev.findIndex((l) => l.productId === productId);
      const currentQty = i === -1 ? 0 : prev[i].quantity;
      const allowed = clampAddQuantity(product, currentQty, qty);
      if (allowed < 1) return prev;

      if (i === -1) {
        trackAddToCart(product, allowed);
        return [...prev, { productId, quantity: allowed }];
      }
      const next = [...prev];
      next[i] = { ...next[i], quantity: currentQty + allowed };
      trackAddToCart(product, allowed);
      return next;
    });
  }, []);

  const remove = useCallback((productId: string) => {
    const product = products.find((p) => p.id === productId);
    setLines((prev) => {
      const line = prev.find((l) => l.productId === productId);
      if (product && line) {
        trackRemoveFromCart(product, line.quantity);
      }
      return prev.filter((l) => l.productId !== productId);
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    if (qty < 1) {
      setLines((prev) => prev.filter((l) => l.productId !== productId));
      return;
    }
    const product = products.find((p) => p.id === productId);
    const capped = product ? Math.min(qty, product.stock) : qty;
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity: capped } : l)),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({ lines, add, remove, setQty, clear }),
    [lines, add, remove, setQty, clear],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
