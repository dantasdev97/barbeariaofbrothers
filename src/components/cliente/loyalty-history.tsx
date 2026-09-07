"use client";

import { useMemo, useState } from "react";
import { Gift, Scissors, Settings2, Sparkles } from "lucide-react";
import type { HistoryEntry, HistoryKind } from "@/lib/loyalty/history";
import { staggerIndex } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * O extracto do cartão.
 *
 * Era uma lista corrida de 8 (ou 20) linhas com a data solta e, no
 * `/minha-conta`, a palavra "Serviço" em todas elas. Três mudanças:
 *
 * - **Agrupado por mês.** É assim que uma pessoa procura no seu próprio
 *   histórico ("foi em agosto"), e dá ritmo a uma lista que era uniforme.
 * - **Filtros.** Encontrar o resgate de que se quer reclamar no meio de
 *   quarenta visitas era percorrer tudo com o polegar.
 * - **Ver mais.** Carrega 10 de cada vez em vez de desenhar cinquenta
 *   linhas que ninguém vai ler.
 */

const KIND_STYLE: Record<
  HistoryKind,
  { label: string; chip: string; icon: typeof Scissors }
> = {
  earn: {
    label: "Ganho",
    chip: "bg-brand/10 text-brand",
    icon: Scissors,
  },
  bonus: {
    label: "Bónus",
    chip: "bg-blue-500/12 text-blue-600",
    icon: Sparkles,
  },
  redeem: {
    label: "Resgate",
    chip: "bg-emerald-500/12 text-emerald-700",
    icon: Gift,
  },
  adjust: {
    label: "Ajuste",
    chip: "bg-muted text-muted-foreground",
    icon: Settings2,
  },
};

type Filter = "all" | "earn" | "redeem";

const PAGE = 10;

export function LoyaltyHistory({
  entries,
  emptyText = "Ainda sem movimentos.",
  showUnit = false,
  className,
}: {
  entries: HistoryEntry[];
  emptyText?: string;
  /** Mostrar a unidade em cada linha. Só interessa a quem usa as duas casas. */
  showUnit?: boolean;
  className?: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [visible, setVisible] = useState(PAGE);

  const counts = useMemo(
    () => ({
      all: entries.length,
      earn: entries.filter((e) => e.kind === "earn" || e.kind === "bonus").length,
      redeem: entries.filter((e) => e.kind === "redeem").length,
    }),
    [entries],
  );

  const filtered = useMemo(() => {
    if (filter === "earn")
      return entries.filter((e) => e.kind === "earn" || e.kind === "bonus");
    if (filter === "redeem") return entries.filter((e) => e.kind === "redeem");
    return entries;
  }, [entries, filter]);

  const shown = filtered.slice(0, visible);

  // Agrupa mantendo a ordem (mais recente primeiro): a lista já vem ordenada
  // do servidor, por isso basta cortar sempre que o mês muda.
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: HistoryEntry[] }[] = [];
    for (const entry of shown) {
      const last = out[out.length - 1];
      if (last && last.key === entry.monthKey) last.items.push(entry);
      else out.push({ key: entry.monthKey, label: entry.monthLabel, items: [entry] });
    }
    return out;
  }, [shown]);

  if (entries.length === 0) {
    return (
      <p
        className={cn(
          "rounded-2xl border border-dashed border-border bg-bg-surface p-8 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {emptyText}
      </p>
    );
  }

  let index = 0;

  return (
    <div className={className}>
      {counts.redeem > 0 && (
        <div
          role="group"
          aria-label="Filtrar histórico"
          className="mb-4 flex flex-wrap gap-1.5"
        >
          {(
            [
              ["all", "Tudo", counts.all],
              ["earn", "Ganhos", counts.earn],
              ["redeem", "Resgates", counts.redeem],
            ] as const
          ).map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setFilter(id);
                setVisible(PAGE);
              }}
              aria-pressed={filter === id}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium",
                "transition-[background-color,color,transform] duration-150 ease-out-strong active:scale-[0.96]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                filter === id
                  ? "bg-brand text-[#0e0a07]"
                  : "border border-border text-muted-foreground hover-fine:hover:text-foreground",
              )}
            >
              {label}
              <span className="font-mono tabular-nums opacity-70">{n}</span>
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-bg-surface p-8 text-center text-sm text-muted-foreground">
          Nada neste filtro.
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.key}>
              <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {group.label}
              </h3>
              <ul className="stagger overflow-hidden rounded-2xl border border-border bg-bg-surface">
                {group.items.map((e) => {
                  const style = KIND_STYLE[e.kind];
                  const Icon = style.icon;
                  const row = index++;
                  return (
                    <li
                      key={e.id}
                      {...staggerIndex(row)}
                      className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:px-5"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          style.chip,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium leading-tight">
                          {e.label}
                        </p>
                        <p
                          className="mt-0.5 truncate text-[11.5px] leading-tight text-muted-foreground"
                          title={e.fullDate}
                        >
                          {/* O tipo por extenso substitui o emoji que aqui
                           * estava: um leitor de ecrã lia "tesoura". */}
                          <span className="sr-only">{style.label}. </span>
                          {showUnit && e.unitName ? `${e.unitName} · ` : ""}
                          {e.dayLabel} · {e.timeLabel}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "shrink-0 font-mono text-[13.5px] font-bold tabular-nums",
                          e.points > 0 ? "text-emerald-600" : "text-muted-foreground",
                        )}
                      >
                        {e.points > 0 ? "+" : ""}
                        {e.points}
                        <span aria-hidden> pts</span>
                        <span className="sr-only"> pontos</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {filtered.length > visible && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE)}
              className="min-h-12 w-full rounded-2xl border border-border text-[14px] font-medium text-muted-foreground transition-[background-color,color,transform] duration-150 ease-out-strong active:scale-[0.99] hover-fine:hover:bg-bg-surface hover-fine:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {filtered.length - visible > PAGE
                ? `Ver mais ${PAGE}`
                : `Ver os últimos ${filtered.length - visible}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
