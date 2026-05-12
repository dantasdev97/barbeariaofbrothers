"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { UnitRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type ProductLite = {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  image_url: string | null;
};

type Props = {
  unit: UnitRow;
  product: ProductLite;
  outOfStock?: boolean;
  className?: string;
};

export function ProductActions({ unit, product, outOfStock = false, className }: Props) {
  const [qty, setQty] = useState(1);
  const router = useRouter();
  const add = useCart((s) => s.add);

  function addToCart() {
    add(
      {
        product_id: product.id,
        unit_slug: unit.slug,
        name: product.name,
        slug: product.slug,
        price_cents: product.price_cents,
        image_url: product.image_url,
      },
      qty,
    );
    trackEvent({
      type: "add_to_cart",
      unit_id: unit.id,
      ref_id: product.id,
      meta: { qty },
    });
    toast.success("Adicionado ao carrinho", {
      description: `${qty}× ${product.name}`,
      action: {
        label: "Ver carrinho",
        onClick: () => router.push(`/${unit.slug}/carrinho`),
      },
    });
  }

  function buyNow() {
    trackEvent({
      type: "booking_click",
      unit_id: unit.id,
      ref_id: product.id,
      meta: { mode: "single", qty },
    });
    router.push(`/${unit.slug}/agendar`);
  }

  if (outOfStock) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <Button
          type="button"
          size="lg"
          disabled
          className="bg-bg-surface text-muted-foreground"
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Esgotado
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={buyNow}
          className="bg-brand text-primary-foreground shadow-premium hover:bg-brand-hover"
        >
          Agendar agora
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-border bg-bg-surface">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="inline-flex h-10 w-10 items-center justify-center text-muted-foreground transition hover:text-foreground active:scale-90"
            aria-label="Diminuir"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-semibold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="inline-flex h-10 w-10 items-center justify-center text-muted-foreground transition hover:text-foreground active:scale-90"
            aria-label="Aumentar"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={addToCart}
          className="flex-1 bg-bg-surface text-foreground hover:bg-secondary"
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Adicionar ao carrinho
        </Button>
      </div>

      <Button
        type="button"
        size="lg"
        onClick={buyNow}
        className="bg-brand text-primary-foreground shadow-premium hover:bg-brand-hover"
      >
        Agendar agora
      </Button>
    </div>
  );
}
