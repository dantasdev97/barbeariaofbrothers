import Link from "next/link";
import {
  Award,
  ChevronRight,
  Coins,
  Gift,
  ScrollText,
  Sparkles,
  Users,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { PageHeader } from "@/components/admin/page-header";
import { MetricCard } from "@/components/admin/metric-card";
import { shortUnitName } from "@/lib/event-labels";
import { staggerIndex } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** A barbearia é em Portugal; o servidor corre em UTC. Ver `admin/page.tsx`. */
const TZ = "Europe/Lisbon";
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
const dayTimeFmt = new Intl.DateTimeFormat("pt-PT", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const monthFmt = new Intl.DateTimeFormat("pt-PT", {
  timeZone: TZ,
  month: "long",
  year: "numeric",
});

/** Dias de história nos sparklines dos cartões. */
const TREND_DAYS = 30;

function startOfMonthISO() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoISO(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

type TxLite = {
  id: string;
  type: string;
  points: number;
  created_at: string;
  reward_id: string | null;
  service_id: string | null;
  client_id: string;
  unit_id: string;
  note: string | null;
};

export default async function FidelidadePage() {
  await requireRole(["super_admin", "manager"]);
  const sb = createAdminClient();
  const monthStart = startOfMonthISO();
  // As séries precisam de 30 dias; o mês pode começar depois disso. Puxa-se
  // o intervalo mais largo dos dois e agrega-se as duas leituras da mesma
  // lista, em vez de fazer duas viagens à base.
  const windowStart =
    monthStart < daysAgoISO(TREND_DAYS) ? monthStart : daysAgoISO(TREND_DAYS);

  const [
    { count: clientsCount },
    { count: newClientsMonth },
    { data: txs },
    { data: balances },
    { data: services },
    { data: rewards },
    { data: bonuses },
  ] = await Promise.all([
    sb.from("clients").select("id", { count: "exact", head: true }),
    sb
      .from("clients")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart),
    // Uma leitura só, agregada de várias maneiras em baixo: assim os números
    // dos cartões nunca se contradizem entre si. O tecto de 5000 chega para
    // 30 dias de duas barbearias com folga.
    sb
      .from("loyalty_transactions")
      .select("id, type, points, created_at, reward_id, service_id, client_id, unit_id, note")
      .gte("created_at", windowStart)
      .order("created_at", { ascending: false })
      .limit(5000),
    // Saldo por cliente e unidade. É a responsabilidade acumulada do
    // programa: pontos que os clientes ainda podem trocar por serviços.
    sb.from("client_unit_balances").select("balance").limit(5000),
    sb.from("loyalty_services").select("id, name, active"),
    sb.from("loyalty_rewards").select("id, name, active"),
    sb.from("loyalty_bonuses").select("id, active"),
  ]);

  const list = (txs ?? []) as unknown as TxLite[];
  const monthTxs = list.filter((t) => t.created_at >= monthStart);

  const issuedTxs = monthTxs.filter(
    (t) => t.type === "earn" || t.type === "bonus",
  );
  const redeemTxs = monthTxs.filter((t) => t.type === "redeem");
  const pointsIssuedMonth = issuedTxs.reduce(
    (acc, t) => acc + (t.points ?? 0),
    0,
  );
  const pointsSpentMonth = redeemTxs.reduce(
    (acc, t) => acc + Math.abs(t.points ?? 0),
    0,
  );
  const outstanding = (balances ?? []).reduce(
    (acc, b) => acc + (b.balance ?? 0),
    0,
  );

  const issuedSeries = dailySeries(list, TREND_DAYS, (t) =>
    t.type === "earn" || t.type === "bonus" ? t.points : 0,
  );
  const redeemSeries = dailySeries(list, TREND_DAYS, (t) =>
    t.type === "redeem" ? 1 : 0,
  );

  // ── Top recompensas resgatadas no mês ──
  const rewardNameMap = new Map(
    (rewards ?? []).map((r) => [r.id as string, r.name as string]),
  );
  const rewardCount = new Map<string, number>();
  for (const t of monthTxs) {
    if (t.type === "redeem" && t.reward_id) {
      rewardCount.set(t.reward_id, (rewardCount.get(t.reward_id) ?? 0) + 1);
    }
  }
  const topRewards = Array.from(rewardCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({
      id,
      name: rewardNameMap.get(id) ?? "Recompensa removida",
      count,
    }));

  // ── Últimos movimentos ──
  // Um extracto de pontos sem o nome de quem os ganhou não serve para nada,
  // por isso vai-se buscar o cliente de cada linha visível (no máximo 8).
  const recent = list.slice(0, 8);
  const clientIds = [...new Set(recent.map((t) => t.client_id))];
  const [{ data: clients }, { data: units }] = await Promise.all([
    clientIds.length
      ? sb.from("clients").select("id, name").in("id", clientIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    sb.from("units").select("id, name"),
  ]);
  const clientNameById = new Map(
    (clients ?? []).map((c) => [c.id as string, c.name as string]),
  );
  const unitNameById = new Map(
    (units ?? []).map((u) => [u.id as string, shortUnitName(u.name as string)]),
  );
  const serviceNameById = new Map(
    (services ?? []).map((s) => [s.id as string, s.name as string]),
  );

  const movements = recent.map((t) => ({
    id: t.id,
    clientId: t.client_id,
    clientName: clientNameById.get(t.client_id) ?? "Cliente removido",
    type: t.type,
    points: t.points,
    unitName: unitNameById.get(t.unit_id) ?? "—",
    detail:
      t.type === "earn"
        ? (t.service_id ? serviceNameById.get(t.service_id) : null) ?? "Serviço"
        : t.type === "redeem"
          ? (t.reward_id ? rewardNameMap.get(t.reward_id) : null) ?? "Recompensa"
          : t.note ?? (t.type === "bonus" ? "Bónus" : "Ajuste"),
    when: dayTimeFmt.format(new Date(t.created_at)),
  }));

  const monthLabel = monthFmt.format(new Date());

  // Os atalhos contam só o que está ligado: um serviço desactivado não dá
  // pontos, e anunciá-lo no contador prometia mais programa do que existe.
  const activeServices = (services ?? []).filter((s) => s.active).length;
  const activeRewards = (rewards ?? []).filter((r) => r.active).length;
  const activeBonuses = (bonuses ?? []).filter((b) => b.active).length;

  return (
    <div>
      <PageHeader
        title="Fidelidade"
        description={`Programa de pontos · ${monthLabel}`}
      />

      {/* ── Configuração do programa ──
       * Eram três botões no cabeçalho: no telemóvel partiam em duas linhas,
       * com o terceiro sozinho e pintado de laranja como se fosse a acção
       * principal — mas nenhum deles é uma acção, são destinos. Como tiles
       * cabem os três numa linha, mostram quantos itens há em cada um e
       * deixam de disputar a atenção com o título. */}
      <nav aria-label="Configuração do programa" className="stagger mb-5 grid grid-cols-3 gap-3">
        <SectionTile
          index={0}
          href="/admin/fidelidade/servicos"
          icon={<ScrollText className="h-4 w-4" />}
          label="Serviços"
          count={activeServices}
          hint="activos"
        />
        <SectionTile
          index={1}
          href="/admin/fidelidade/bonus"
          icon={<Award className="h-4 w-4" />}
          label="Bónus"
          count={activeBonuses}
          hint="activos"
        />
        <SectionTile
          index={2}
          href="/admin/fidelidade/recompensas"
          icon={<Gift className="h-4 w-4" />}
          label="Recompensas"
          count={activeRewards}
          hint="activas"
        />
      </nav>

      <div className="stagger mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div {...staggerIndex(0)}>
          <MetricCard
            label="Clientes com cartão"
            value={clientsCount ?? 0}
            hint={
              newClientsMonth ? `+${newClientsMonth} este mês` : "sem novos este mês"
            }
            tone="blue"
            icon={<Users className="h-4 w-4" />}
          />
        </div>
        <div {...staggerIndex(1)}>
          <MetricCard
            label="Pontos emitidos · mês"
            value={pointsIssuedMonth}
            hint={`${issuedTxs.length} lançamentos`}
            tone="brand"
            icon={<Sparkles className="h-4 w-4" />}
            series={issuedSeries}
          />
        </div>
        <div {...staggerIndex(2)}>
          <MetricCard
            label="Resgates · mês"
            value={redeemTxs.length}
            hint={`${pointsSpentMonth} pts usados`}
            tone="green"
            icon={<Gift className="h-4 w-4" />}
            series={redeemSeries}
          />
        </div>
        <div {...staggerIndex(3)}>
          <MetricCard
            label="Pontos em circulação"
            value={outstanding}
            hint="por resgatar"
            tone="mute"
            icon={<Coins className="h-4 w-4" />}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* ── Top recompensas ── */}
        <section
          aria-labelledby="top-recompensas"
          className="overflow-hidden rounded-2xl border border-border bg-bg-surface"
        >
          <div className="px-5 py-4 sm:px-6">
            <h2
              id="top-recompensas"
              className="font-heading text-base font-semibold tracking-tight"
            >
              Recompensas mais resgatadas
            </h2>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Em {monthLabel}
            </p>
          </div>

          {topRewards.length === 0 ? (
            <EmptyPanel
              icon={<Gift className="h-5 w-5" />}
              text="Sem resgates este mês."
            />
          ) : (
            <ol className="stagger border-t border-border px-5 py-2 sm:px-6">
              {topRewards.map((r, i) => (
                <li key={r.id} {...staggerIndex(i)} className="py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13px] font-medium">
                      {r.name}
                    </span>
                    <span className="shrink-0 font-mono text-[12.5px] font-semibold tabular-nums text-brand">
                      {r.count}
                      <span aria-hidden>×</span>
                      <span className="sr-only"> resgates</span>
                    </span>
                  </div>
                  <div
                    aria-hidden
                    className="mt-1.5 h-1 overflow-hidden rounded-full bg-background"
                  >
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{
                        width: `${Math.max(
                          4,
                          Math.round((r.count / topRewards[0].count) * 100),
                        )}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ── Últimos movimentos ──
         * O painel dizia quantos pontos tinham sido emitidos, mas não a quem
         * nem por quê. Isto é o extracto: dá para confirmar um lançamento
         * feito ao balcão sem abrir a ficha do cliente. */}
        <section
          aria-labelledby="ultimos-movimentos"
          className="overflow-hidden rounded-2xl border border-border bg-bg-surface"
        >
          <div className="px-5 py-4 sm:px-6">
            <h2
              id="ultimos-movimentos"
              className="font-heading text-base font-semibold tracking-tight"
            >
              Últimos movimentos
            </h2>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Ganhos, bónus e resgates
            </p>
          </div>

          {movements.length === 0 ? (
            <EmptyPanel
              icon={<Sparkles className="h-5 w-5" />}
              text="Sem lançamentos nos últimos 30 dias."
            />
          ) : (
            <ul className="stagger">
              {movements.map((m, i) => (
                <li key={m.id} {...staggerIndex(i)}>
                  <Link
                    href={`/admin/clientes/${m.clientId}`}
                    className="flex items-center gap-3 border-t border-border px-4 py-2.5 transition-colors duration-150 hover-fine:hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 active:bg-background sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13.5px] font-medium leading-tight">
                          {m.clientName}
                        </span>
                        <TxChip type={m.type} />
                      </div>
                      <p className="mt-0.5 truncate text-[11.5px] leading-tight text-muted-foreground">
                        {m.detail} · {m.unitName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className={cn(
                          "font-mono text-[13px] font-semibold tabular-nums leading-tight",
                          m.points >= 0 ? "text-emerald-600" : "text-destructive",
                        )}
                      >
                        {m.points > 0 ? "+" : ""}
                        {m.points}
                        <span aria-hidden> pts</span>
                        <span className="sr-only"> pontos</span>
                      </div>
                      <div className="text-[11px] leading-tight text-muted-foreground">
                        {m.when}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/** Atalho para uma secção de configuração do programa. */
function SectionTile({
  href,
  icon,
  label,
  count,
  hint,
  index,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  hint: string;
  index: number;
}) {
  return (
    <Link
      href={href}
      {...staggerIndex(index)}
      className="group flex flex-col gap-1 rounded-xl border border-border bg-bg-surface p-3 transition-[border-color,transform,background-color] duration-150 ease-out-strong hover-fine:hover:border-brand/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <span className="flex items-center justify-between text-brand">
        {icon}
        {/* O chevron é decoração: no telemóvel roubava os pixels que faltavam
         * a "Recompensas", que ficava "Recompen…". */}
        <ChevronRight
          aria-hidden
          className="hidden h-3.5 w-3.5 text-muted-foreground sm:block"
        />
      </span>
      <span className="mt-1 text-[13px] font-semibold leading-tight">
        {label}
      </span>
      <span className="text-[11.5px] text-muted-foreground">
        <span className="font-mono tabular-nums">{count}</span> {hint}
      </span>
    </Link>
  );
}

const TX_CHIP: Record<string, { label: string; className: string }> = {
  earn: { label: "Ganho", className: "bg-emerald-500/12 text-emerald-600" },
  redeem: { label: "Resgate", className: "bg-brand/12 text-brand" },
  bonus: { label: "Bónus", className: "bg-blue-500/12 text-blue-600" },
  adjust: { label: "Ajuste", className: "bg-muted text-muted-foreground" },
};

function TxChip({ type }: { type: string }) {
  const chip = TX_CHIP[type] ?? {
    label: type,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]",
        chip.className,
      )}
    >
      {chip.label}
    </span>
  );
}

function EmptyPanel({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 border-t border-border px-6 py-12 text-center text-muted-foreground">
      <span aria-hidden>{icon}</span>
      <p className="text-sm">{text}</p>
    </div>
  );
}

/**
 * Um valor por dia, do mais antigo ao mais recente. `valueOf` decide o que
 * cada transacção contribui — pontos, no caso dos ganhos; uma unidade, no
 * caso dos resgates.
 */
function dailySeries(
  txs: TxLite[],
  days: number,
  valueOf: (tx: TxLite) => number,
): number[] {
  const buckets = new Array<number>(days).fill(0);
  const [y, m, d] = dayKeyFmt.format(new Date()).split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  const index = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const key = new Date(base - (days - 1 - i) * 86_400_000)
      .toISOString()
      .slice(0, 10);
    index.set(key, i);
  }
  for (const t of txs) {
    const i = index.get(dayKeyFmt.format(new Date(t.created_at)));
    if (i !== undefined) buckets[i] += valueOf(t);
  }
  return buckets;
}
