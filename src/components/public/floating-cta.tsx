"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import type { UnitRow } from "@/types/database.types";
import { useT } from "@/components/public/locale-provider";

type Props = {
  unit: UnitRow;
  /** Decide se o botão convida a criar cartão ou leva ao cartão existente. */
  hasCard?: boolean;
};

/**
 * Botão fixo do canto inferior — agora aponta para o programa de pontos.
 *
 * Antes levava ao Buk e tinha um `if (!unit.buk_url) return null`. Esse
 * gate saiu de propósito: os pontos não dependem do link de marcações, e
 * mantê-lo escondia o botão numa unidade sem Buk configurado.
 *
 * O agendamento não desaparece da página — continua no cabeçalho e no botão
 * do hero. O que muda é só o atalho fixo.
 *
 * Sem animação de entrada: este botão aparece em todas as páginas da
 * unidade, várias vezes por sessão, e animar o que se vê muitas vezes ao dia
 * faz a interface parecer lenta. Fica só o feedback de toque.
 */
export function FloatingCTA({ unit, hasCard = false }: Props) {
  const { t } = useT();

  // Quem já tem cartão quer chegar aos pontos dele; quem não tem precisa
  // primeiro de saber o que ganha. Prometer "os meus pontos" a quem não tem
  // cartão nenhum é prometer uma coisa que não existe.
  const href = hasCard ? "/minha-conta" : `/programa?unidade=${unit.slug}`;
  const label = hasCard ? t.cta.points : t.cta.getPoints;

  return (
    <Link
      href={href}
      onClick={() =>
        trackEvent({
          type: "loyalty_click",
          unit_id: unit.id,
          meta: { source: hasCard ? "floating-cta-card" : "floating-cta-join" },
        })
      }
      className="fixed bottom-6 right-6 z-40 flex min-h-12 items-center gap-2.5 rounded-full bg-foreground px-5 py-3.5 text-sm font-medium text-background shadow-[0_16px_40px_-8px_rgba(0,0,0,0.5)] transition-[background-color,color,transform] duration-150 ease-out-strong hover-fine:hover:-translate-y-0.5 hover-fine:hover:bg-brand hover-fine:hover:text-primary-foreground active:scale-[0.96]"
    >
      <Sparkles className="h-4 w-4" />
      {label} →
    </Link>
  );
}
