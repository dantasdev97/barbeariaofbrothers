"use client";

import { useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { UnitRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { trackEvent } from "@/lib/analytics";
import { buildCheckoutMessage, whatsappLink } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/utils";

type Props = { unit: UnitRow };

export function CartView({ unit }: Props) {
  // SSR-safe hydration check
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const items = useCart((s) => s.items);
  const unitSlug = useCart((s) => s.unitSlug);
  const total = useCart((s) => s.totalCents());
  const remove = useCart((s) => s.remove);
  const setQuantity = useCart((s) => s.setQuantity);
  const clear = useCart((s) => s.clear);
  const setUnit = useCart((s) => s.setUnit);

  useEffect(() => {
    setUnit(unit.slug);
  }, [unit.slug, setUnit]);

  if (!hydrated) {
    return (
      <div className="container-page py-16">
        <div className="h-8 w-48 animate-pulse rounded bg-bg-surface" />
      </div>
    );
  }

  // Items belong to a different unit — protect against cross-unit checkout
  const unitItems =
    unitSlug && unitSlug !== unit.slug
      ? []
      : items;

  function checkout() {
    if (!unit.whatsapp) {
      toast.error("WhatsApp não configurado para esta unidade.");
      return;
    }
    if (unitItems.length === 0) return;
    const msg = buildCheckoutMessage(unitItems, unit);
    trackEvent({
      type: "whatsapp_checkout",
      unit_id: unit.id,
      meta: {
        items: unitItems.length,
        total_cents: total,
      },
    });
    window.open(whatsappLink(unit.whatsapp, msg), "_blank", "noopener");
  }

  return (
    <section className="container-page py-12 sm:py-16">
      <header className="mb-8">
        <span className="text-xs uppercase tracking-[0.2em] text-brand">Carrinho</span>
        <h1 className="mt-2 font-heading text-4xl font-semibold sm:text-5xl">
          O seu pedido
        </h1>
      </header>

      {unitItems.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-surface p-10 text-center">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-brand" />
          <p className="text-muted-foreground">O seu carrinho está vazio.</p>
          <Button
            asChild
            className="mt-6 bg-brand text-primary-foreground hover:bg-brand-hover"
          >
            <Link href={`/${unit.slug}#produtos`}>Ver produtos</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <ul className="space-y-3">
            {unitItems.map((item) => (
              <li
                key={item.product_id}
                className="flex gap-4 rounded-2xl border border-border bg-bg-surface p-3 sm:p-4"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-background sm:h-24 sm:w-24">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-brand" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/${unit.slug}/produtos/${item.slug}`}
                      className="font-heading text-base font-semibold hover:text-brand"
                    >
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(item.product_id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatPrice(item.price_cents)} cada
                  </span>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border border-border bg-bg-surface">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.product_id, item.quantity - 1)
                        }
                        className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-label="Diminuir"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(item.product_id, item.quantity + 1)
                        }
                        className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-label="Aumentar"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="font-bold text-brand">
                      {formatPrice(item.price_cents * item.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-2xl border border-border bg-bg-surface p-6">
            <h2 className="font-heading text-lg font-semibold">Resumo</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd className="text-brand">{formatPrice(total)}</dd>
              </div>
            </dl>

            <Button
              onClick={checkout}
              size="lg"
              className="mt-6 w-full bg-brand text-primary-foreground shadow-premium hover:bg-brand-hover"
            >
              Concluir via WhatsApp
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="mt-2 w-full text-muted-foreground hover:text-foreground"
            >
              Esvaziar carrinho
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Confirmamos disponibilidade e o melhor método de levantamento por
              WhatsApp.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
