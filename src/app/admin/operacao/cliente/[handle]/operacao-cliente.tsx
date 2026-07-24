"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Check, Gift, Loader2, Scissors } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AnimatedNumber } from "@/components/admin/animated-number";
import { staggerIndex } from "@/lib/motion";
import { loyaltyEarn, loyaltyRedeem } from "@/lib/loyalty/actions";
import type {
  ClientRow,
  LoyaltyRewardRow,
  LoyaltyServiceRow,
  LoyaltyTransactionRow,
} from "@/types/database.types";

type Mode = "earn" | "redeem";

export function OperacaoCliente({
  client,
  unitId,
  unitName,
  balance,
  transactions,
  services,
  rewards,
}: {
  client: ClientRow;
  unitId: string;
  unitName: string;
  balance: number;
  transactions: LoyaltyTransactionRow[];
  services: LoyaltyServiceRow[];
  rewards: LoyaltyRewardRow[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("earn");
  const [pending, startTransition] = useTransition();
  /**
   * Qual acção está em curso. Antes existia só o booleano do `useTransition`,
   * que desactivava a lista inteira sem dizer em qual botão o barbeiro tocou.
   * Guardando o id, só esse botão mostra spinner.
   */
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toRedeem, setToRedeem] = useState<LoyaltyRewardRow | null>(null);

  function earn(serviceId: string, name: string, pts: number) {
    if (pending) return;
    setBusyId(serviceId);
    startTransition(async () => {
      try {
        await loyaltyEarn(client.id, unitId, serviceId);
        toast.success(`+${pts} pts · ${name}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falhou.");
      } finally {
        setBusyId(null);
      }
    });
  }

  function confirmRedeem() {
    if (!toRedeem) return;
    const reward = toRedeem;
    setBusyId(reward.id);
    startTransition(async () => {
      try {
        await loyaltyRedeem(client.id, unitId, reward.id);
        toast.success(`Resgatado: ${reward.name}`);
        setToRedeem(null);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falhou.");
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/admin/operacao"
        className="mb-4 -ml-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm text-muted-foreground transition-colors duration-150 hover-fine:hover:text-foreground"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Operação
      </Link>

      {/* Cliente + saldo */}
      <div className="mb-5 rounded-2xl border border-brand/40 bg-gradient-to-br from-bg-surface to-background p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
          {unitName}
        </p>
        <h1 className="mt-1 font-heading text-[26px] font-semibold leading-tight tracking-tight">
          {client.name}
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{client.phone}</p>
        <div className="mt-5 flex items-baseline gap-2">
          {/* O saldo conta até ao novo valor depois de lançar um serviço.
           * É a confirmação visual do que acabou de acontecer — antes o
           * número trocava de repente e o único sinal era o toast. */}
          <span className="font-heading text-[48px] font-bold leading-none tracking-tight tabular-nums text-brand">
            <AnimatedNumber value={balance} />
          </span>
          <span className="text-sm uppercase tracking-wider text-muted-foreground">
            pts
          </span>
        </div>
      </div>

      {/* Separadores */}
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-border bg-bg-surface p-1">
        {(
          [
            ["earn", "Lançar serviço"],
            ["redeem", "Resgatar"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition-[background-color,color,transform] duration-200 ease-out-strong active:scale-[0.97] ${
              mode === value
                ? "bg-brand text-[#0e0a07]"
                : "text-muted-foreground hover-fine:hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "earn" && (
        <div className="stagger space-y-2">
          {services.length === 0 ? (
            <ActionEmpty
              icon={<Scissors className="h-5 w-5" />}
              text="Sem serviços configurados para esta unidade."
            />
          ) : (
            services.map((s, i) => {
              const busy = busyId === s.id;
              return (
                <button
                  key={s.id}
                  {...staggerIndex(i)}
                  disabled={pending}
                  onClick={() => earn(s.id, s.name, s.points_value)}
                  className="flex min-h-14 w-full items-center justify-between rounded-xl border border-border bg-bg-surface px-5 py-4 text-left transition-[border-color,background-color,transform,opacity] duration-150 ease-out-strong hover-fine:hover:border-brand/60 hover-fine:hover:bg-background active:scale-[0.99] disabled:opacity-60"
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="flex items-center gap-2 font-mono text-sm font-semibold text-brand">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    +{s.points_value} pts
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}

      {mode === "redeem" && (
        <div className="stagger space-y-2">
          {rewards.length === 0 ? (
            <ActionEmpty
              icon={<Gift className="h-5 w-5" />}
              text="Sem recompensas configuradas para esta unidade."
            />
          ) : (
            rewards.map((r, i) => {
              const enough = balance >= r.points_cost;
              const busy = busyId === r.id;
              return (
                <button
                  key={r.id}
                  {...staggerIndex(i)}
                  disabled={pending || !enough}
                  onClick={() => setToRedeem(r)}
                  className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border bg-bg-surface px-5 py-4 text-left transition-[border-color,background-color,transform,opacity] duration-150 ease-out-strong ${
                    enough
                      ? "border-border hover-fine:hover:border-brand/60 hover-fine:hover:bg-background active:scale-[0.99] disabled:opacity-60"
                      : "border-border opacity-50"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      <Gift className="h-4 w-4 shrink-0 text-brand" />
                      <span className="truncate">{r.name}</span>
                    </div>
                    {r.description && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {r.description}
                      </div>
                    )}
                    {!enough && (
                      <div className="mt-1 text-[11px] font-medium text-muted-foreground">
                        Faltam {r.points_cost - balance} pts
                      </div>
                    )}
                  </div>
                  <span className="flex shrink-0 items-center gap-2 font-mono text-sm font-semibold text-brand">
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {r.points_cost} pts
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Histórico curto */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-bg-surface">
        <div className="border-b border-border px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Últimas visitas nesta unidade
        </div>
        {transactions.length === 0 ? (
          <p className="px-5 py-6 text-center text-xs text-muted-foreground">
            Sem transações ainda.
          </p>
        ) : (
          <div className="stagger">
            {transactions.map((t, i) => (
              <div
                key={t.id}
                {...staggerIndex(i)}
                className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[13px]">
                    {t.type === "earn"
                      ? "Serviço"
                      : t.type === "redeem"
                      ? "Resgate"
                      : "Ajuste"}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString("pt-PT", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
                <span
                  className={`font-mono text-[13px] font-semibold tabular-nums ${
                    t.points > 0 ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  {t.points > 0 ? "+" : ""}
                  {t.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Antes isto era um `window.confirm()` nativo — um modal do browser
       * no meio do fluxo mais usado do painel. */}
      <ConfirmDialog
        open={!!toRedeem}
        onOpenChange={(open) => {
          if (!open && !pending) setToRedeem(null);
        }}
        variant="default"
        title="Confirmar resgate"
        description={
          toRedeem
            ? `Resgatar "${toRedeem.name}" por ${toRedeem.points_cost} pts? O saldo de ${client.name} passa a ${balance - toRedeem.points_cost} pts.`
            : ""
        }
        confirmLabel="Resgatar"
        loadingLabel="A resgatar…"
        onConfirm={confirmRedeem}
        loading={pending}
      />
    </div>
  );
}

function ActionEmpty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-bg-surface px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-muted-foreground">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
