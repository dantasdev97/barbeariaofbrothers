"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Check, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  function earn(serviceId: string, name: string, pts: number) {
    if (pending) return;
    startTransition(async () => {
      try {
        await loyaltyEarn(client.id, unitId, serviceId);
        toast.success(`+${pts} pts · ${name}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falhou.");
      }
    });
  }

  function redeem(rewardId: string, name: string, cost: number) {
    if (pending) return;
    if (balance < cost) return toast.error("Saldo insuficiente.");
    if (!confirm(`Confirmar resgate: ${name} (–${cost} pts)?`)) return;
    startTransition(async () => {
      try {
        await loyaltyRedeem(client.id, unitId, rewardId);
        toast.success(`Resgatado: ${name}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falhou.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/admin/operacao"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Operação
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
          <span className="font-heading text-[48px] font-bold leading-none tracking-tight text-brand">
            {balance}
          </span>
          <span className="text-sm uppercase tracking-wider text-muted-foreground">
            pts
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-border bg-bg-surface p-1">
        <button
          onClick={() => setMode("earn")}
          className={`rounded-lg py-2.5 text-sm font-semibold transition ${
            mode === "earn"
              ? "bg-brand text-[#0e0a07]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Lançar serviço
        </button>
        <button
          onClick={() => setMode("redeem")}
          className={`rounded-lg py-2.5 text-sm font-semibold transition ${
            mode === "redeem"
              ? "bg-brand text-[#0e0a07]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Resgatar
        </button>
      </div>

      {mode === "earn" && (
        <div className="space-y-2">
          {services.length === 0 ? (
            <p className="rounded-2xl border border-border bg-bg-surface p-6 text-center text-sm text-muted-foreground">
              Sem serviços configurados para esta unidade.
            </p>
          ) : (
            services.map((s) => (
              <button
                key={s.id}
                disabled={pending}
                onClick={() => earn(s.id, s.name, s.points_value)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-bg-surface px-5 py-4 text-left transition hover:border-brand/60 hover:bg-background disabled:opacity-60"
              >
                <span className="font-medium">{s.name}</span>
                <span className="font-mono text-sm font-semibold text-brand">
                  +{s.points_value} pts
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {mode === "redeem" && (
        <div className="space-y-2">
          {rewards.length === 0 ? (
            <p className="rounded-2xl border border-border bg-bg-surface p-6 text-center text-sm text-muted-foreground">
              Sem recompensas configuradas para esta unidade.
            </p>
          ) : (
            rewards.map((r) => {
              const enough = balance >= r.points_cost;
              return (
                <button
                  key={r.id}
                  disabled={pending || !enough}
                  onClick={() => redeem(r.id, r.name, r.points_cost)}
                  className={`flex w-full items-center justify-between rounded-xl border bg-bg-surface px-5 py-4 text-left transition ${
                    enough
                      ? "border-border hover:border-brand/60 hover:bg-background"
                      : "border-border opacity-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <Gift className="h-4 w-4 text-brand" /> {r.name}
                    </div>
                    {r.description && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {r.description}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-sm font-semibold text-brand">
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
          transactions.map((t) => (
            <div
              key={t.id}
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
                className={`font-mono text-[13px] font-semibold ${
                  t.points > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {t.points > 0 ? "+" : ""}
                {t.points} pts
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
