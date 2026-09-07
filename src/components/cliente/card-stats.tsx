import { Scissors, Sparkles, Gift } from "lucide-react";
import type { CardStats } from "@/lib/loyalty/history";
import { staggerIndex } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * O que o cliente já fez, em três números.
 *
 * O cartão dizia quantos pontos tem agora e nada sobre o caminho até aqui.
 * Um programa de fidelidade vive de dar a sensação de progresso acumulado —
 * "23 visitas" faz mais pela vontade de voltar do que o saldo actual.
 *
 * Só aparece quando há alguma coisa para contar: três zeros num cartão
 * acabado de criar são o contrário de encorajador.
 */
export function CardStats({
  stats,
  memberSince,
  className,
}: {
  stats: CardStats;
  /** "agosto de 2026", já formatado no servidor. */
  memberSince: string | null;
  className?: string;
}) {
  if (stats.visits === 0 && stats.pointsEarned === 0) return null;

  const tiles = [
    {
      icon: <Scissors aria-hidden className="h-4 w-4" />,
      value: stats.visits,
      label: stats.visits === 1 ? "visita" : "visitas",
    },
    {
      icon: <Sparkles aria-hidden className="h-4 w-4" />,
      value: stats.pointsEarned,
      label: "pontos ganhos",
    },
    {
      icon: <Gift aria-hidden className="h-4 w-4" />,
      value: stats.redeemed,
      label: stats.redeemed === 1 ? "resgate" : "resgates",
    },
  ];

  return (
    <section className={cn("stagger", className)}>
      <div className="grid grid-cols-3 gap-2.5">
        {tiles.map((t, i) => (
          <div
            key={t.label}
            {...staggerIndex(i)}
            className="rounded-2xl border border-border bg-bg-surface p-3.5 text-center"
          >
            <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
              {t.icon}
            </span>
            <p className="mt-2 font-heading text-[22px] font-semibold leading-none tabular-nums">
              {t.value}
            </p>
            <p className="mt-1 text-[11.5px] leading-tight text-muted-foreground">
              {t.label}
            </p>
          </div>
        ))}
      </div>
      {memberSince && (
        <p className="mt-2.5 text-center text-[12px] text-muted-foreground">
          Cliente desde {memberSince}
        </p>
      )}
    </section>
  );
}
