"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type UnidadeState = {
  slug: string | null;
  setSlug: (slug: string) => void;
  clear: () => void;
};

export const useUnidade = create<UnidadeState>()(
  persist(
    (set) => ({
      slug: null,
      setSlug: (slug) => {
        // Mirror to a non-HttpOnly cookie so the proxy can pick it up
        if (typeof document !== "undefined") {
          const oneYear = 60 * 60 * 24 * 365;
          const secure = location.protocol === "https:" ? "; secure" : "";
          document.cookie = `unit_slug=${slug}; path=/; max-age=${oneYear}; samesite=lax${secure}`;
        }
        set({ slug });
      },
      clear: () => {
        if (typeof document !== "undefined") {
          document.cookie = "unit_slug=; path=/; max-age=0";
        }
        set({ slug: null });
      },
    }),
    {
      name: "bof.unidade.v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
