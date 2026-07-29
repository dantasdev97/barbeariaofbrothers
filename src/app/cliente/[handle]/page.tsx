import { notFound } from "next/navigation";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { Gift, MapPin, QrCode, Sparkles } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { cardUrl } from "@/lib/loyalty/qr";
import { getClientByHandle } from "@/lib/loyalty/queries";
import { getAllUnits } from "@/lib/data";
import { Header } from "@/components/public/header";
import { Footer } from "@/components/public/footer";

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
      sb
        .from("loyalty_transactions")
        .select("id, unit_id, type, points, service_id, reward_id, created_at")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(8),
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
    margin: 1,
    width: 600,
    errorCorrectionLevel: "M",
    color: { dark: "#0A0A0A", light: "#ffffff" },
  });

  const svcMap = new Map((services ?? []).map((s) => [s.id, s.name as string]));
  const rwMap = new Map((rewards ?? []).map((r) => [r.id, r.name as string]));
  const unitMap = new Map(allUnits.map((u) => [u.id, u.name]));

  // Recompensas da unidade principal
  const visibleRewards = (rewards ?? []).filter(
    (r) => r.unit_id === primaryUnit?.id,
  );

  // Próximo objetivo
  const nextReward = visibleRewards.find(
    (r) => r.points_cost > primaryBalance.balance,
  );
  const nextPct = nextReward
    ? Math.round((primaryBalance.balance / nextReward.points_cost) * 100)
    : 100;

  return (
    <>
      {primaryUnit && <Header unit={primaryUnit} units={allUnits} />}
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          {/* Hero / Cartão */}
          <section className="rounded-3xl bg-foreground p-1 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]">
            <div className="rounded-[22px] bg-gradient-to-br from-foreground via-foreground to-[#1a1410] p-7 text-background sm:p-9">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
                    <Sparkles className="h-3 w-3" />
                    Cartão Fidelidade
                  </p>
                  <h1 className="mt-3 font-heading text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">
                    {client.name}
                  </h1>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-background/70">
                    <MapPin className="h-3.5 w-3.5" />
                    {primaryUnit?.name ?? "Of Brothers"}
                  </p>
                </div>

                <div className="hidden text-right sm:block">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-background/50">
                    Saldo atual
                  </p>
                  <p className="font-heading text-[56px] font-bold leading-none tracking-tight text-brand">
                    {primaryBalance.balance}
                    <span className="ml-1 text-base text-background/60">pts</span>
                  </p>
                </div>
              </div>

              {/* Mobile balance */}
              <div className="mt-6 flex items-end gap-2 sm:hidden">
                <p className="font-heading text-[64px] font-bold leading-none tracking-tight text-brand">
                  {primaryBalance.balance}
                </p>
                <p className="mb-3 text-sm uppercase tracking-[0.18em] text-background/60">
                  pts
                </p>
              </div>

              {/* Progresso até próxima recompensa */}
              {nextReward && (
                <div className="mt-6 rounded-2xl bg-background/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-background/80">
                      Falta para <strong className="text-background">{nextReward.name}</strong>
                    </span>
                    <span className="font-mono text-brand">
                      {nextReward.points_cost - primaryBalance.balance} pts
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/15">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${nextPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* QR */}
              <div className="mt-7 flex flex-col items-center gap-3 rounded-2xl bg-background p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR Code do cartão"
                  className="h-44 w-44 sm:h-48 sm:w-48"
                />
                <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-foreground/60">
                  <QrCode className="h-3.5 w-3.5" />
                  Mostra ao barbeiro para somar pontos
                </p>
              </div>
            </div>
          </section>

          {/* Outras unidades */}
          {(balances ?? []).filter((b) => b.unit_id !== primaryUnit?.id && b.balance > 0).length >
            0 && (
            <section className="mt-8 rounded-2xl border border-border bg-bg-surface p-5">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Saldos noutras unidades
              </h2>
              <div className="mt-3 grid gap-2">
                {(balances ?? [])
                  .filter((b) => b.unit_id !== primaryUnit?.id && b.balance > 0)
                  .map((b) => (
                    <div
                      key={b.unit_id}
                      className="flex items-center justify-between rounded-lg bg-background px-4 py-3 text-sm"
                    >
                      <span className="font-medium">{unitMap.get(b.unit_id) ?? "—"}</span>
                      <span className="font-mono font-semibold text-brand">{b.balance} pts</span>
                    </div>
                  ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Total acumulado: <span className="font-semibold text-foreground">{totalBalance} pts</span>
              </p>
            </section>
          )}

          {/* Recompensas */}
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="font-heading text-[22px] font-semibold leading-tight tracking-tight sm:text-2xl">
                  Recompensas
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {primaryUnit?.name}
                </p>
              </div>
              <Gift className="h-5 w-5 text-brand" />
            </div>

            {visibleRewards.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-bg-surface p-8 text-center text-sm text-muted-foreground">
                Recompensas em breve.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleRewards.map((r) => {
                  const pct = Math.min(
                    100,
                    Math.round((primaryBalance.balance / r.points_cost) * 100),
                  );
                  const unlocked = primaryBalance.balance >= r.points_cost;
                  return (
                    <div
                      key={r.id}
                      className={`group rounded-2xl border p-5 transition ${
                        unlocked
                          ? "border-brand bg-brand/5 shadow-[0_4px_20px_-8px_rgba(243,146,0,0.35)]"
                          : "border-border bg-bg-surface hover:border-brand/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
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
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-brand transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p
                        className={`mt-2 text-right text-[11px] font-medium ${
                          unlocked ? "text-brand" : "text-muted-foreground"
                        }`}
                      >
                        {unlocked
                          ? "✓ Pronto a resgatar"
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
            <h2 className="mb-4 font-heading text-[22px] font-semibold leading-tight tracking-tight sm:text-2xl">
              Histórico recente
            </h2>
            {(txs ?? []).length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-bg-surface p-8 text-center text-sm text-muted-foreground">
                Ainda sem visitas registadas.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-bg-surface">
                {(txs ?? []).map((t, i) => {
                  const detail =
                    t.type === "earn"
                      ? svcMap.get(t.service_id ?? "") ?? "Serviço"
                      : t.type === "redeem"
                      ? rwMap.get(t.reward_id ?? "") ?? "Resgate"
                      : "Ajuste";
                  const d = new Date(t.created_at);
                  const isPositive = t.points > 0;
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between gap-3 px-5 py-4 text-sm ${
                        i > 0 ? "border-t border-border" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${
                            t.type === "earn"
                              ? "bg-brand/10 text-brand"
                              : t.type === "redeem"
                              ? "bg-foreground/8 text-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {t.type === "earn" ? "✂" : t.type === "redeem" ? "🎁" : "↺"}
                        </span>
                        <div>
                          <div className="font-medium">{detail}</div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {unitMap.get(t.unit_id) ?? "—"} ·{" "}
                            {d.toLocaleDateString("pt-PT", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`font-mono text-sm font-bold ${
                          isPositive ? "text-brand" : "text-muted-foreground"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {t.points} pts
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      {primaryUnit && <Footer unit={primaryUnit} />}
    </>
  );
}
