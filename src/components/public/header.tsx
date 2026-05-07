"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, X } from "lucide-react";
import type { UnitRow } from "@/types/database.types";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

type Props = { unit: UnitRow };

export function Header({ unit }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const totalItems = useCart((s) => s.totalItems());

  const base = `/${unit.slug}`;
  const links = [
    { href: `${base}/barbeiros`, label: "Barbeiros" },
    { href: `${base}/produtos`, label: "Produtos" },
    { href: `${base}#sobre`, label: "Sobre" },
    { href: `${base}/contato`, label: "Contacto" },
  ];

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

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = l.href === base
              ? pathname === base
              : pathname?.startsWith(l.href.split("#")[0]);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-full px-4 py-2 text-[14px] font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

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

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-surface md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-bg-surface hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            {unit.buk_url && (
              <a
                href={unit.buk_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setOpen(false);
                  trackEvent({
                    type: "booking_click",
                    unit_id: unit.id,
                    meta: { source: "mobile-menu" },
                  });
                }}
                className="mt-2 inline-flex items-center justify-center rounded-xl bg-foreground px-3 py-2.5 text-sm font-semibold text-background"
              >
                Agendar agora
              </a>
            )}
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-bg-surface"
            >
              Mudar de unidade
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
