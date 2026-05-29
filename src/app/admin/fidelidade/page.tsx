import Link from "next/link";
import { Gift, ScrollText } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function startOfMonthISO() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function FidelidadePage() {
  await requireRole(["super_admin", "manager"]);
  const sb = createAdminClient();
  const monthStart = startOfMonthISO();

  const [
    { count: clientsCount },
    { count: earnsMonth },
    { data: earnedSumRows },
    { count: redeemsMonth },
    { data: monthTxs },
  ] = await Promise.all([
    sb.from("clients").select("id", { count: "exact", head: true }),
    sb
      .from("loyalty_transactions")
      .select("id", { count: "exact", head: true })
      .eq("type", "earn")
      .gte("created_at", monthStart),
    sb
      .from("loyalty_transactions")
      .select("points")
      .eq("type", "earn")
      .gte("created_at", monthStart),
    sb
      .from("loyalty_transactions")
      .select("id", { count: "exact", head: true })
      .eq("type", "redeem")
      .gte("created_at", monthStart),
    sb
      .from("loyalty_transactions")
      .select("type, points, created_at, reward_id")
      .gte("created_at", monthStart)
      .limit(2000),
  ]);

  const totalPointsThisMonth = (earnedSumRows ?? []).reduce(
    (acc, t) => acc + (t.points ?? 0),
    0,
  );

  // Top recompensas resgatadas no mês
  const rewardCount = new Map<string, number>();
  for (const t of monthTxs ?? []) {
    if (t.type === "redeem" && t.reward_id) {
      rewardCount.set(t.reward_id, (rewardCount.get(t.reward_id) ?? 0) + 1);
    }
  }
  const topRewardIds = Array.from(rewardCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const { data: rewardRows } = await sb
    .from("loyalty_rewards")
    .select("id, name")
    .in("id", topRewardIds.map(([id]) => id).concat(["00000000-0000-0000-0000-000000000000"]));
  const rewardNameMap = new Map(
    (rewardRows ?? []).map((r) => [r.id as string, r.name as string]),
  );

  return (
    <div>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-[28px] font-semibold leading-none tracking-tight sm:text-[32px]">
            Fidelidade
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Programa de pontos · visão geral
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/fidelidade/servicos"
            className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-transparent px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
          >
            <ScrollText className="h-4 w-4" /> Serviços
          </Link>
          <Link
            href="/admin/fidelidade/recompensas"
            className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-4 py-2.5 text-[13px] font-medium text-[#0e0a07] transition hover:opacity-90"
          >
            <Gift className="h-4 w-4" /> Recompensas
          </Link>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Clientes cadastrados" value={String(clientsCount ?? 0)} />
        <Stat
          label="Pontos emitidos · mês"
          value={String(totalPointsThisMonth)}
          delta={`${earnsMonth ?? 0} lançamentos`}
        />
        <Stat label="Resgates · mês" value={String(redeemsMonth ?? 0)} />
        <Stat
          label="Saldo médio (mês)"
          value={
            earnsMonth && earnsMonth > 0
              ? Math.round(totalPointsThisMonth / earnsMonth).toString()
              : "0"
          }
          delta="pts / cliente"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-bg-surface">
        <div className="border-b border-border px-6 py-[22px]">
          <div className="font-heading text-base font-semibold tracking-tight">
            Top recompensas resgatadas
          </div>
          <div className="mt-0.5 text-[12.5px] text-muted-foreground">
            Este mês
          </div>
        </div>
        {topRewardIds.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted-foreground">
            Sem resgates este mês.
          </p>
        ) : (
          topRewardIds.map(([id, count], i) => (
            <div
              key={id}
              className="grid gap-3 border-t border-border px-6 py-3 text-sm md:grid-cols-[2rem_1fr_auto] md:items-center"
            >
              <div className="font-heading text-[13px] font-bold text-muted-foreground">
                #{i + 1}
              </div>
              <div className="font-medium">{rewardNameMap.get(id) ?? id.slice(0, 8)}</div>
              <div className="font-mono text-[13px] text-brand">{count}×</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-surface p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="my-2 flex items-baseline gap-3">
        <div className="font-heading text-[32px] font-semibold leading-none tracking-tight">
          {value}
        </div>
        {delta && (
          <div className="rounded-full bg-brand/15 px-2 py-0.5 text-[12px] font-semibold text-brand">
            {delta}
          </div>
        )}
      </div>
    </div>
  );
}
