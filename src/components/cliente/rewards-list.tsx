import { Gift } from "lucide-react";
import { formatRewardValue, rewardKindIcon } from "@/lib/loyalty/rewards";
import { staggerIndex } from "@/lib/motion";
import type { LoyaltyRewardRow } from "@/types/database.types";

/**
 * "Formas de resgatar" — partilhada entre `/programa` e `/minha-conta`.
 *
 * Em `/programa` é só vitrina; no cartão, cada recompensa ganha o botão de
 * resgatar através de `renderAction`. A lista é a mesma nos dois sítios para
 * o que a pessoa viu antes de criar conta ser exactamente o que encontra
 * depois.
 */
export function RewardsList({
  rewards,
  balance,
  renderAction,
  className,
}: {
  rewards: LoyaltyRewardRow[];
  /** Quando dado, mostra quanto falta para cada recompensa. */
  balance?: number;
  /** Botão de resgatar, só no cartão autenticado. */
  renderAction?: (reward: LoyaltyRewardRow, affordable: boolean) => React.ReactNode;
  className?: string;
}) {
  if (rewards.length === 0) {
    return (
      <div
        className={`flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-bg-surface px-6 py-10 text-center ${className ?? ""}`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-muted-foreground">
          <Gift className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">
          Recompensas em preparação.
        </p>
      </div>
    );
  }

  return (
    <div className={`stagger grid gap-3 ${className ?? ""}`}>
      {rewards.map((r, i) => {
        const Icon = rewardKindIcon(r.kind);
        const value = formatRewardValue(r.kind, r.value_cents, r.percent);
        const affordable = balance == null || balance >= r.points_cost;
        const missing = balance != null ? r.points_cost - balance : 0;

        return (
          <div
            key={r.id}
            {...staggerIndex(i)}
            className={`rounded-2xl border p-5 transition-[border-color,box-shadow] duration-200 ease-out-strong ${
              balance != null && affordable
                ? "border-brand bg-brand/5"
                : "border-border bg-bg-surface"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading text-base font-semibold leading-tight">
                  {r.name}
                  {value && (
                    <span className="ml-2 font-sans text-sm font-medium text-brand">
                      {value}
                    </span>
                  )}
                </h3>
                {r.description && (
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {r.description}
                  </p>
                )}
                {balance != null && !affordable && (
                  <p className="mt-1.5 text-[12.5px] font-medium text-muted-foreground">
                    Faltam {missing} pts
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-foreground px-3 py-1 font-mono text-[12px] font-bold tabular-nums text-background">
                {r.points_cost}
              </span>
            </div>

            {renderAction && (
              <div className="mt-4">{renderAction(r, affordable)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
