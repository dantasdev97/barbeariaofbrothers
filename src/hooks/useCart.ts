"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/types/database.types";

type CartState = {
  unitSlug: string | null;
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  setUnit: (slug: string) => void;
  totalCents: () => number;
  totalItems: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      unitSlug: null,
      items: [],
      add: (item, qty = 1) =>
        set((state) => {
          // Cart is scoped per unit: switching units wipes the cart
          if (state.unitSlug && state.unitSlug !== item.unit_slug) {
            return {
              unitSlug: item.unit_slug,
              items: [{ ...item, quantity: qty }],
            };
          }
          const existing = state.items.find(
            (i) => i.product_id === item.product_id,
          );
          if (existing) {
            return {
              unitSlug: item.unit_slug,
              items: state.items.map((i) =>
                i.product_id === item.product_id
                  ? { ...i, quantity: i.quantity + qty }
                  : i,
              ),
            };
          }
          return {
            unitSlug: item.unit_slug,
            items: [...state.items, { ...item, quantity: qty }],
          };
        }),
      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.product_id !== productId)
              : state.items.map((i) =>
                  i.product_id === productId ? { ...i, quantity } : i,
                ),
        })),
      clear: () => set({ items: [] }),
      setUnit: (slug) =>
        set((state) =>
          state.unitSlug === slug
            ? state
            : { unitSlug: slug, items: [] },
        ),
      totalCents: () =>
        get().items.reduce((acc, i) => acc + i.price_cents * i.quantity, 0),
      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
    }),
    {
      name: "bof.cart.v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ unitSlug: state.unitSlug, items: state.items }),
    },
  ),
);
