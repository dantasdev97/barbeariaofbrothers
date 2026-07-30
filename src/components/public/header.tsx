"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, ShoppingBag, UserRound } from "lucide-react";
import type { UnitRow } from "@/types/database.types";
import { useCart } from "@/hooks/useCart";
import { useUnidade } from "@/hooks/useUnidade";
import { trackEvent } from "@/lib/analytics";
import { useT } from "@/components/public/locale-provider";
import { LanguageSwitcher } from "@/components/public/language-switcher";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type Props = {
  unit: UnitRow;
  units: UnitRow[];
  /**
   * Quem já tem cartão vai direito a ele; quem não tem passa primeiro pelo
   * programa. Vem do servidor (`getCardState`) porque o cabeçalho não pode
   * consultar a base — e sem isto o ícone prometeria "os meus pontos" a
   * quem ainda não tem nenhum.
   */
  hasCard?: boolean;
};

export function Header({ unit, units, hasCard = false }: Props) {
  const router = useRouter();
  const setSlug = useUnidade((s) => s.setSlug);
  const totalItems = useCart((s) => s.totalItems());
  const { t } = useT();

  const base = `/${unit.slug}`;

  const unitNum = unit.name.replace(/\D/g, "") || unit.slug.replace(/\D/g, "") || "1";

  function switchUnit(slug: string) {
    setSlug(slug);
    router.push(`/${slug}`);
  }

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
              {t.header.unitLabel} {unitNum}
            </div>
          </div>
        </Link>



        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Unit switcher dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-[13px] font-medium transition hover:border-foreground">
              <span className="h-2 w-2 rounded-full bg-brand shadow-[0_0_0_3px_rgba(243,146,0,0.2)]" />
              {t.header.unitLabel} {unitNum}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {units.map((u) => (
                <DropdownMenuItem
                  key={u.id}
                  onClick={() => switchUnit(u.slug)}
                  className="flex items-center justify-between gap-2"
                >
                  <span>{u.name}</span>
                  {u.slug === unit.slug ? (
                    <Check className="h-4 w-4 text-brand" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
              {t.header.bookNow}
            </a>
          )}

          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Cartão fidelidade. O slug vai sempre no link de quem ainda não
           * tem cartão: é o que permite criá-lo sozinho do outro lado do
           * login, em vez de voltar a perguntar a barbearia. */}
          <Link
            href={hasCard ? "/minha-conta" : `/programa?unidade=${unit.slug}`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-surface text-foreground transition hover:bg-border"
            aria-label={t.header.loyalty}
            title={t.header.loyalty}
          >
            <UserRound className="h-4 w-4" />
            {hasCard && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand" />
            )}
          </Link>

          {/* Cart */}
          <Link
            href={`${base}/carrinho`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-surface text-foreground transition hover:bg-border"
            aria-label={t.header.cart}
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
