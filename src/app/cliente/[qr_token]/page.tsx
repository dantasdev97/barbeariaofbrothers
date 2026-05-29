import { notFound } from "next/navigation";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { cardUrl } from "@/lib/loyalty/qr";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ qr_token: string }>;
}): Promise<Metadata> {
  const { qr_token } = await params;
  const sb = createAdminClient();
  const { data } = await sb
    .from("clients")
    .select("name")
    .eq("qr_token", qr_token)
    .maybeSingle();
  return {
    title: data?.name
      ? `Cartão Of Brothers · ${data.name}`
      : "Cartão Of Brothers",
    robots: { index: false, follow: false },
  };
}

export default async function CartaoPublico({
  params,
}: {
  params: Promise<{ qr_token: string }>;
}) {
  const { qr_token } = await params;
  const sb = createAdminClient();

  const { data: client } = await sb
    .from("clients")
    .select("*")
    .eq("qr_token", qr_token)
    .maybeSingle();
  if (!client) notFound();

  const [{ data: units }, { data: balances }, { data: txs }, { data: rewards }] =
    await Promise.all([
      sb.from("units").select("id, name, slug").order("name"),
      sb
        .from("client_unit_balances")
        .select("unit_id, balance")
        .eq("client_id", client.id),
      sb
        .from("loyalty_transactions")
        .select("id, unit_id, type, points, service_id, reward_id, created_at")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(5),
      sb
        .from("loyalty_rewards")
        .select("id, name, description, points_cost, unit_id, active")
        .eq("active", true)
        .order("points_cost"),
    ]);

  const totalBalance = (balances ?? []).reduce(
    (acc, b) => acc + (b.balance ?? 0),
    0,
  );

  // Saldo "principal" = maior entre unidades, com fallback à unidade de cadastro
  const primaryBalance = (balances ?? []).reduce(
    (best, b) => ((b.balance ?? 0) > best.balance ? b : best),
    { unit_id: client.unit_id, balance: 0 },
  );
  const primaryUnit =
    units?.find((u) => u.id === primaryBalance.unit_id) ??
    units?.find((u) => u.id === client.unit_id);

  // QR como data URL
  const url = cardUrl(client.qr_token);
  const qrDataUrl = await QRCode.toDataURL(url, {
    margin: 1,
    width: 600,
    errorCorrectionLevel: "M",
    color: { dark: "#0A0A0A", light: "#F5F5F0" },
  });

  // Serviços (para resolver nomes do histórico)
  const { data: services } = await sb
    .from("loyalty_services")
    .select("id, name, points_value");
  const svcMap = new Map((services ?? []).map((s) => [s.id, s.name as string]));
  const rwMap = new Map((rewards ?? []).map((r) => [r.id, r.name as string]));
  const unitMap = new Map((units ?? []).map((u) => [u.id, u.name as string]));

  // Recompensas visíveis (relativas ao saldo principal)
  const visibleRewards = (rewards ?? []).filter(
    (r) => r.unit_id === primaryUnit?.id,
  );

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-[#F5F5F0]">
      <div className="mx-auto max-w-md px-5 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-heading text-xl font-bold tracking-tight text-[#C9A84C]">
              Of Brothers
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#F5F5F0]/60">
              Cartão Fidelidade
            </div>
          </div>
          <a
            href="https://instagram.com/barbeariaofbrothers"
            target="_blank"
            rel="noopener"
            className="text-xs uppercase tracking-wider text-[#C9A84C]/80"
          >
            @ofbrothers
          </a>
        </div>

        {/* Card principal */}
        <div className="overflow-hidden rounded-2xl border border-[#C9A84C]/40 bg-gradient-to-br from-[#141414] to-[#0A0A0A] p-7 shadow-[0_8px_32px_rgba(201,168,76,0.08)]">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#C9A84C]">
            {primaryUnit?.name ?? "Of Brothers"}
          </p>
          <h1 className="mt-1.5 font-heading text-[28px] font-semibold leading-tight tracking-tight">
            {client.name}
          </h1>

          <div className="my-7 flex items-end justify-center gap-2">
            <span className="font-heading text-[80px] font-bold leading-none tracking-tight text-[#C9A84C]">
              {primaryBalance.balance}
            </span>
            <span className="mb-3 text-sm uppercase tracking-[0.18em] text-[#F5F5F0]/70">
              pts
            </span>
          </div>

          <div className="mx-auto w-full max-w-[260px] rounded-2xl bg-[#F5F5F0] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR Code do cartão"
              className="block h-full w-full"
            />
          </div>
          <p className="mt-3 text-center text-[11px] uppercase tracking-[0.18em] text-[#F5F5F0]/50">
            Mostra este código ao barbeiro
          </p>
        </div>

        {/* Outras unidades */}
        {(balances ?? []).filter((b) => b.unit_id !== primaryUnit?.id && b.balance > 0)
          .length > 0 && (
          <div className="mt-5 rounded-xl border border-[#C9A84C]/20 bg-[#141414] p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-[#F5F5F0]/60">
              Saldos noutras unidades
            </div>
            <div className="mt-2 space-y-1">
              {(balances ?? [])
                .filter((b) => b.unit_id !== primaryUnit?.id && b.balance > 0)
                .map((b) => (
                  <div key={b.unit_id} className="flex justify-between text-sm">
                    <span>{unitMap.get(b.unit_id) ?? "—"}</span>
                    <span className="font-mono text-[#C9A84C]">{b.balance} pts</span>
                  </div>
                ))}
            </div>
            <div className="mt-2 border-t border-[#C9A84C]/10 pt-2 text-xs text-[#F5F5F0]/60">
              Total acumulado: <span className="text-[#C9A84C]">{totalBalance} pts</span>
            </div>
          </div>
        )}

        {/* Recompensas */}
        <section className="mt-7">
          <h2 className="mb-3 font-heading text-base font-semibold tracking-tight">
            Recompensas disponíveis
          </h2>
          {visibleRewards.length === 0 ? (
            <p className="text-xs text-[#F5F5F0]/50">
              Recompensas em breve.
            </p>
          ) : (
            <div className="space-y-2">
              {visibleRewards.map((r) => {
                const pct = Math.min(
                  100,
                  Math.round((primaryBalance.balance / r.points_cost) * 100),
                );
                const unlocked = primaryBalance.balance >= r.points_cost;
                return (
                  <div
                    key={r.id}
                    className={`rounded-xl border p-4 transition ${
                      unlocked
                        ? "border-[#C9A84C]/60 bg-[#C9A84C]/5"
                        : "border-[#F5F5F0]/10 bg-[#141414]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{r.name}</div>
                      <div className="font-mono text-xs text-[#C9A84C]">
                        {r.points_cost} pts
                      </div>
                    </div>
                    {r.description && (
                      <p className="mt-0.5 text-[11px] text-[#F5F5F0]/60">
                        {r.description}
                      </p>
                    )}
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#F5F5F0]/10">
                      <div
                        className="h-full bg-[#C9A84C]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[10px] text-[#F5F5F0]/50">
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
        <section className="mt-7">
          <h2 className="mb-3 font-heading text-base font-semibold tracking-tight">
            Últimas visitas
          </h2>
          {(txs ?? []).length === 0 ? (
            <p className="text-xs text-[#F5F5F0]/50">
              Ainda sem visitas registadas.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#F5F5F0]/10">
              {(txs ?? []).map((t) => {
                const detail =
                  t.type === "earn"
                    ? svcMap.get(t.service_id ?? "") ?? "Serviço"
                    : t.type === "redeem"
                    ? rwMap.get(t.reward_id ?? "") ?? "Resgate"
                    : "Ajuste";
                const d = new Date(t.created_at);
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 border-b border-[#F5F5F0]/10 px-4 py-3 text-sm last:border-b-0"
                  >
                    <div>
                      <div>{detail}</div>
                      <div className="font-mono text-[11px] text-[#F5F5F0]/50">
                        {unitMap.get(t.unit_id) ?? "—"} ·{" "}
                        {d.toLocaleDateString("pt-PT", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                    </div>
                    <div
                      className={`font-mono font-semibold ${
                        t.points > 0 ? "text-[#C9A84C]" : "text-[#F5F5F0]/70"
                      }`}
                    >
                      {t.points > 0 ? "+" : ""}
                      {t.points}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-10 text-center">
          <div className="font-heading text-base font-semibold text-[#C9A84C]">
            Of Brothers
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#F5F5F0]/40">
            Tradição moderna · Desde 2012
          </p>
        </footer>
      </div>
    </div>
  );
}
