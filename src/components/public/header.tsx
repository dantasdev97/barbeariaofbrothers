"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, X } from "lucide-react";
import type { UnitRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
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
    { href: base, label: "Início" },
    { href: `${base}/barbeiros`, label: "Barbeiros" },
    { href: `${base}/produtos`, label: "Produtos" },
    { href: `${base}/contato`, label: "Contacto" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href={base} className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Barbearia Of Brothers"
            width={36}
            height={36}
            className="h-9 w-auto"
            priority
          />
          <span className="hidden font-heading text-sm font-semibold sm:block">
            Of Brothers
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active =
              l.href === base ? pathname === base : pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition",
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {unit.buk_url && (
            <Button
              asChild
              size="sm"
              className="hidden bg-brand text-primary-foreground hover:bg-brand-hover sm:inline-flex"
            >
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
              >
                Agendar agora
              </a>
            </Button>
          )}
          <Link
            href={`${base}/carrinho`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-foreground transition hover:bg-white/10"
            aria-label="Carrinho"
          >
            <ShoppingBag className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-background/95 md:hidden">
          <nav className="container-page flex flex-col gap-1 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
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
                className="mt-2 inline-flex items-center justify-center rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Agendar agora
              </a>
            )}
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-white/5"
            >
              Trocar de unidade
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
