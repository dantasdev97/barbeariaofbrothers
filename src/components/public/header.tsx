"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { UnitRow } from "@/types/database.types";
import { useCart } from "@/hooks/useCart";
import { trackEvent } from "@/lib/analytics";

type Props = { unit: UnitRow };

export function Header({ unit }: Props) {
  const totalItems = useCart((s) => s.totalItems());

  const base = `/${unit.slug}`;

  const unitNum = unit.name.replace(/\D/g, "") || unit.slug.replace(/\D/g, "") || "1";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href={base} className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Barbearia Of Brothers"
            width={36}
            height={36}
            className="h-9 w-auto"
            priority
          />
          <div className="hidden sm:block">
            <div className="font-heading text-[13px] font-bold uppercase tracking-[0.04em] leading-none text-foreground">
              Barbearia Brothers
            </div>
            <div className="mt-0.5 text-[11px] leading-none text-muted-foreground">
              Unidade {unitNum}
            </div>
          </div>
        </Link>



        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Unit switcher pill */}
          <Link
            href="/"
            className="hidden items-center gap-2 rounded-full border border-border px-3.5 py-2 text-[13px] font-medium transition hover:border-foreground sm:flex"
          >
            <span className="h-2 w-2 rounded-full bg-brand shadow-[0_0_0_3px_rgba(243,146,0,0.2)]" />
            Unidade {unitNum}
            <span className="text-[10px] text-muted-foreground">▾</span>
          </Link>

          {/* Book now */}
          {unit.buk_url && (
            <a
              href={unit.buk_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent({
                  type: "booking_click",
                  unit_id: unit.id,
                  meta: { source: "header" },
                })
              }
              className="hidden rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-brand hover:text-[#1a1410] sm:inline-flex"
            >
              Agendar agora
            </a>
          )}

          {/* Cart */}
          <Link
            href={`${base}/carrinho`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-surface text-foreground transition hover:bg-border"
            aria-label="Carrinho"
          >
            <ShoppingBag className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-[#1a1410]">
                {totalItems}
              </span>
            )}
          </Link>

        </div>
      </div>
    </header>
  );
}
