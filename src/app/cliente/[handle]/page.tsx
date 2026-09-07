import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { ArrowRight, Gift } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cardUrl } from "@/lib/loyalty/qr";
import { getClientByHandle } from "@/lib/loyalty/queries";
import { getAllUnits } from "@/lib/data";
import { buildHistory, buildStats } from "@/lib/loyalty/history";
import { TZ } from "@/lib/date-range";
import { CardStats } from "@/components/cliente/card-stats";
import { LoyaltyCard, type NextReward } from "@/components/cliente/loyalty-card";
import { LoyaltyHistory } from "@/components/cliente/loyalty-history";
import { Header } from "@/components/public/header";
import { Footer } from "@/components/public/footer";
import { staggerIndex } from "@/lib/motion";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const client = await getClientByHandle(handle);
  return {
    title: client?.name
      ? `Cartão Fidelidade · ${client.name}`
      : "Cartão Fidelidade",
    robots: { index: false, follow: false },
  };
}

export default async function CartaoPublico({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const sb = createAdminClient();

  const client = await getClientByHandle(handle);
  if (!client) notFound();

  const allUnits = await getAllUnits();

  const [{ data: balances }, { data: txs }, { data: rewards }, { data: services }] =
    await Promise.all([
      sb
        .from("client_unit_balances")
        .select("unit_id, balance")
        .eq("client_id", client.id),
      // 200 e não 8: o histórico agrupa por mês e revela 10 de cada vez, e é
      // desta lista que saem as contagens de visitas e pontos ganhos.
      sb
        .from("loyalty_transactions")
        .select(
          "id, unit_id, type, points, service_id, reward_id, bonus_kind, note, created_at",
        )
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(200),
      sb
        .from("loyalty_rewards")
        .select("id, name, description, points_cost, unit_id, active")
        .eq("active", true)
        .order("points_cost"),
      sb.from("loyalty_services").select("id, name, points_value"),
    ]);

  const totalBalance = (balances ?? []).reduce(
    (acc, b) => acc + (b.balance ?? 0),
    0,
  );

  // Unidade principal = a com maior saldo; fallback à de cadastro
  const primaryBalance = (balances ?? []).reduce(
    (best, b) => ((b.balance ?? 0) > best.balance ? b : best),
    { unit_id: client.unit_id, balance: 0 },
  );
  const primaryUnit =
    allUnits.find((u) => u.id === primaryBalance.unit_id) ??
    allUnits.find((u) => u.id === client.unit_id) ??
    allUnits[0];

  // QR sempre com o slug amigável
  const url = cardUrl(client.public_slug ?? client.qr_token);
  const qrDataUrl = await QRCode.toDataURL(url, {
    margin: 2,
    width: 600,
    errorCorrectionLevel: "M",
    color: { dark: "#0A0A0A", light: "#ffffff" },
  });

  const unitMap = new Map(allUnits.map((u) => [u.id, u.name]));
  const history = buildHistory(txs ?? [], {
    services: new Map((services ?? []).map((s) => [s.id, s.name as string])),
    rewards: new Map((rewards ?? []).map((r) => [r.id, r.name as string])),
    units: unitMap,
  });
  const stats = buildStats(history);

  const memberSince = client.created_at
    ? new Intl.DateTimeFormat("pt-PT", {
        timeZone: TZ,
        month: "long",
        year: "numeric",
      }).format(new Date(client.created_at))
    : null;

  // Recompensas da unidade principal
  const visibleRewards = (rewards ?? []).filter(
    (r) => r.unit_id === primaryUnit?.id,
  );

  // Próximo objetivo
  const upcoming = visibleRewards.find(
    (r) => r.points_cost > primaryBalance.balance,
  );
  const nextReward: NextReward | null = upcoming
    ? {
        name: upcoming.name,
        cost: upcoming.points_cost,
        missing: upcoming.points_cost - primaryBalance.balance,
        pct: Math.min(
          100,
          Math.round((primaryBalance.balance / upcoming.points_cost) * 100),
        ),
      }
    : null;

  // Este cartão é de quem o está a ver? Só muda o convite no fim da página:
  // o dono vai gerir o cartão, quem chega sem sessão fica a saber que pode
  // resgatar se entrar. Nada do que se mostra depende disto.
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  const isOwner = !!user && user.id === client.auth_user_id;

  const otherBalances = (balances ?? []).filter(
    (b) => b.unit_id !== primaryUnit?.id && b.balance > 0,
  );

  return (
    <>
      {primaryUnit && <Header unit={primaryUnit} units={allUnits} />}
      <main className="flex-1 bg-background">
        <div className="page-enter mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
          <LoyaltyCard
            name={client.name}
            unitName={primaryUnit?.name ?? null}
            balance={primaryBalance.balance}
            qrDataUrl={qrDataUrl}
            nextReward={nextReward}
            bookingUrl={primaryUnit?.buk_url ?? null}
          />

          <CardStats stats={stats} memberSince={memberSince} className="mt-5" />

          {/* Saldos noutras unidades */}
          {otherBalances.length > 0 && (
            <section className="mt-8 rounded-2xl border border-border bg-bg-surface p-5">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Saldos noutras unidades
              </h2>
              <div className="mt-3 grid gap-2">
                {otherBalances.map((b) => (
                  <div
                    key={b.unit_id}
                    className="flex items-center justify-between rounded-lg bg-background px-4 py-3 text-sm"
                  >
                    <span className="font-medium">
                      {unitMap.get(b.unit_id) ?? "—"}
                    </span>
                    <span className="font-mono font-semibold text-brand">
                      {b.balance}
                      <span aria-hidden> pts</span>
                      <span className="sr-only"> pontos</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11.5px] text-muted-foreground">
                Total acumulado:{" "}
                <span className="font-semibold text-foreground">
                  {totalBalance} pts
                </span>
              </p>
            </section>
          )}

          {/* Recompensas */}
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-heading text-[22px] font-semibold leading-tight tracking-tight">
                  Recompensas
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {primaryUnit?.name}
                </p>
              </div>
              <Gift aria-hidden className="h-5 w-5 shrink-0 text-brand" />
            </div>

            {visibleRewards.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-bg-surface p-8 text-center text-sm text-muted-foreground">
                Recompensas em breve.
              </p>
            ) : (
              <div className="stagger grid gap-3 sm:grid-cols-2">
                {visibleRewards.map((r, i) => {
                  const pct = Math.min(
                    100,
                    Math.round((primaryBalance.balance / r.points_cost) * 100),
                  );
                  const unlocked = primaryBalance.balance >= r.points_cost;
                  return (
                    <div
                      key={r.id}
                      {...staggerIndex(i)}
                      className={`rounded-2xl border p-5 transition-[border-color] duration-150 ${
                        unlocked
                          ? "border-brand bg-brand/5 shadow-[0_4px_20px_-8px_rgba(243,146,0,0.35)]"
                          : "border-border bg-bg-surface hover-fine:hover:border-brand/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-heading text-base font-semibold leading-tight">
                            {r.name}
                          </h3>
                          {r.description && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {r.description}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 rounded-full bg-foreground px-2.5 py-1 font-mono text-[11px] font-bold text-background">
                          {r.points_cost} pts
                        </div>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Progresso para ${r.name}`}
                        className="mt-4 h-1.5 overflow-hidden rounded-full bg-border"
                      >
                        <div
                          className="progress-grow h-full rounded-full bg-brand"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p
                        className={`mt-2 text-right text-[11.5px] font-medium ${
                          unlocked ? "text-brand" : "text-muted-foreground"
                        }`}
                      >
                        {unlocked
                          ? "Pronto a resgatar"
                          : `Faltam ${r.points_cost - primaryBalance.balance} pts`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Histórico */}
          <section className="mt-10">
            <h2 className="mb-4 font-heading text-[22px] font-semibold leading-tight tracking-tight">
              Histórico
            </h2>
            <LoyaltyHistory
              entries={history}
              emptyText="Ainda sem visitas registadas."
              showUnit={otherBalances.length > 0}
            />
          </section>

          {/* Este cartão é só de leitura: resgatar exige sessão. Sem este
           * convite, quem já tem pontos suficientes não tinha como saber
           * onde os trocar. */}
          <Link
            href={isOwner ? "/minha-conta" : "/entrar"}
            className="mt-10 flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border bg-bg-surface px-5 py-4 transition-[background-color,transform] duration-150 ease-out-strong active:scale-[0.99] hover-fine:hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <span className="min-w-0">
              <span className="block font-medium leading-tight">
                {isOwner ? "Gerir o meu cartão" : "É o seu cartão?"}
              </span>
              <span className="mt-0.5 block text-[13px] text-muted-foreground">
                {isOwner
                  ? "Resgatar pontos, ver cupões e dados da conta"
                  : "Entre para resgatar os seus pontos"}
              </span>
            </span>
            <ArrowRight aria-hidden className="h-5 w-5 shrink-0 text-brand" />
          </Link>
        </div>
      </main>
      {primaryUnit && <Footer unit={primaryUnit} />}
    </>
  );
}
