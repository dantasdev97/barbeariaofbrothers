"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import type { UnitRow } from "@/types/database.types";
import { useT } from "@/components/public/locale-provider";

type Props = { unit: UnitRow };

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
export function FloatingCTA({ unit }: Props) {
  const { t } = useT();

  return (
    <Link
      href={`/programa?unidade=${unit.slug}`}
      onClick={() =>
        trackEvent({
          type: "loyalty_click",
          unit_id: unit.id,
          meta: { source: "floating-cta" },
        })
      }
      className="fixed bottom-6 right-6 z-40 flex min-h-12 items-center gap-2.5 rounded-full bg-foreground px-5 py-3.5 text-sm font-medium text-background shadow-[0_16px_40px_-8px_rgba(0,0,0,0.5)] transition-[background-color,color,transform] duration-150 ease-out-strong hover-fine:hover:-translate-y-0.5 hover-fine:hover:bg-brand hover-fine:hover:text-primary-foreground active:scale-[0.96]"
    >
      <Sparkles className="h-4 w-4" />
      {t.cta.points} →
    </Link>
  );
}
