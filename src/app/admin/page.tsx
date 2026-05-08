import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const sb = await createClient();

  const todayStr = new Date().toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [
    { count: barbersCount },
    { count: productsCount },
    { count: bookingsTodayCount },
    { count: bookings30dCount },
    { count: pageViews30d },
    { data: recentActivity },
    { data: topBarberEvents },
    { data: barbers },
  ] = await Promise.all([
    sb.from("barbers").select("*", { count: "exact", head: true }),
    sb.from("products").select("*", { count: "exact", head: true }),
    sb
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("type", "booking_click")
      .gte("created_at", startOfDayISO()),
    sb
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("type", "booking_click")
      .gte("created_at", daysAgoISO(30)),
    sb
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("type", "page_view")
      .gte("created_at", daysAgoISO(30)),
    sb
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6),
    sb
      .from("events")
      .select("ref_id")
      .eq("type", "barber_view")
      .gte("created_at", daysAgoISO(7))
      .limit(500),
    sb.from("barbers").select("id, name").eq("active", true).limit(20),
  ]);

  // Build top barbers ranking
  const barberViewMap = new Map<string, number>();
  for (const ev of topBarberEvents ?? []) {
    if (!ev.ref_id) continue;
    barberViewMap.set(ev.ref_id, (barberViewMap.get(ev.ref_id) ?? 0) + 1);
  }
  const barberById = new Map(
    (barbers ?? []).map((b) => [b.id, b.name as string]),
  );
  const topBarbers = Array.from(barberViewMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, views]) => ({
      name: barberById.get(id) ?? id.slice(0, 8),
      views,
    }));
  const maxViews = topBarbers[0]?.views ?? 1;

  return (
    <div>
      {/* ── Top bar ── */}
      <div className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold leading-none tracking-tight sm:text-[32px]">
            Dashboard
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
            Visão geral das duas unidades · {todayStr}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] border border-border bg-transparent px-3 py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-background hover:text-foreground sm:flex-initial sm:px-4 sm:text-[13px]"
          >
            ↗ Exportar
          </button>
          <Link
            href="/admin/barbeiros"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-brand px-3 py-2.5 text-xs font-medium text-[#0e0a07] transition hover:opacity-90 sm:flex-initial sm:px-4 sm:text-[13px]"
          >
            + Novo barbeiro
          </Link>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-5 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Agendamentos · hoje"
          value={String(bookingsTodayCount ?? 0)}
          delta={`${bookings30dCount ?? 0} este mês`}
          color="orange"
          idx={0}
        />
        <StatCard
          label="Visualizações · 30d"
          value={String(pageViews30d ?? 0)}
          delta="page views"
          color="green"
          idx={1}
        />
        <StatCard
          label="Produtos"
          value={String(productsCount ?? 0)}
          delta="no catálogo"
          color="blue"
          idx={2}
        />
        <StatCard
          label="Barbeiros activos"
          value={String(barbersCount ?? 0)}
          delta="2 unidades"
          color="mute"
          idx={3}
        />
      </div>

      {/* ── Content row ── */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Activity table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-bg-surface">
          <div className="flex items-start justify-between border-b border-border px-6 py-[22px]">
            <div>
              <div className="font-heading text-base font-semibold tracking-tight">
                Atividade recente
              </div>
              <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                Todas as unidades
              </div>
            </div>
          </div>

          {/* Table head */}
          <div
            className="hidden gap-3 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:grid sm:px-6"
            style={{ gridTemplateColumns: "1.6fr 1.2fr 0.6fr 1fr" }}
          >
            <div>Tipo</div>
            <div>Referência</div>
            <div>Hora</div>
            <div>Estado</div>
          </div>

          {(recentActivity ?? []).length === 0 ? (
            <p className="px-4 py-10 text-sm text-muted-foreground sm:px-6">
              Sem eventos recentes.
            </p>
          ) : (
            (recentActivity ?? []).map((ev) => {
              const d = new Date(ev.created_at as string);
              const timeStr = d.toLocaleTimeString("pt-PT", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const isBooking = ev.type === "booking_click";
              return (
                <div
                  key={ev.id}
                  className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3 text-sm transition hover:bg-background sm:grid sm:gap-3 sm:px-6"
                  style={{ gridTemplateColumns: "1.6fr 1.2fr 0.6fr 1fr" } as React.CSSProperties}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background text-xs">
                      {eventIcon(ev.type as string)}
                    </div>
                    <span className="text-[13px] font-medium">
                      {eventLabel(ev.type as string)}
                    </span>
                  </div>
                  <div className="hidden truncate font-mono text-[12.5px] text-muted-foreground sm:block">
                    {ev.ref_id ? ev.ref_id.slice(0, 8) + "…" : "—"}
                  </div>
                  <div className="ml-auto font-mono text-[12.5px] text-muted-foreground sm:ml-0">
                    {timeStr}
                  </div>
                  <div className="w-full sm:w-auto">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        isBooking
                          ? "bg-green-500/10 text-green-400"
                          : "bg-brand/10 text-brand"
                      }`}
                    >
                      {isBooking ? "● Agendamento" : "◌ Visita"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Top barbers */}
        <div className="overflow-hidden rounded-2xl border border-border bg-bg-surface">
          <div className="border-b border-border px-6 py-[22px]">
            <div className="font-heading text-base font-semibold tracking-tight">
              Top barbeiros
            </div>
            <div className="mt-0.5 text-[12.5px] text-muted-foreground">
              Esta semana · visualizações
            </div>
          </div>
          <div className="px-5 py-4">
            {topBarbers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sem dados esta semana.
              </p>
            ) : (
              topBarbers.map((b, i) => (
                <div
                  key={b.name}
                  className={`flex gap-3.5 py-3.5 ${
                    i < topBarbers.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-heading text-[13px] font-bold ${
                      i === 0
                        ? "bg-brand text-[#0e0a07]"
                        : "bg-background text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium">{b.name}</div>
                    <div className="mb-2 mt-0.5 text-[11.5px] text-muted-foreground">
                      {b.views} visualizações
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{
                          width: `${Math.round((b.views / maxViews) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  color,
  idx,
}: {
  label: string;
  value: string;
  delta: string;
  color: "orange" | "green" | "blue" | "mute";
  idx: number;
}) {
  const deltaClass = {
    orange: "bg-brand/15 text-brand",
    green: "bg-green-500/15 text-green-400",
    blue: "bg-blue-500/15 text-blue-400",
    mute: "bg-background text-muted-foreground",
  }[color];

  const barClass = {
    orange: "bg-brand/50",
    green: "bg-green-500/50",
    blue: "bg-blue-500/50",
    mute: "bg-border",
  }[color];

  const bars = Array.from({ length: 20 }, (_, j) => ({
    height: `${20 + Math.abs(Math.sin(idx * 3 + j) * 80)}%`,
  }));

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-bg-surface p-3 sm:rounded-2xl sm:p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]">
        {label}
      </div>
      <div className="my-2 flex flex-wrap items-baseline gap-2 sm:my-3 sm:gap-3">
        <div className="font-heading text-xl font-semibold leading-none tracking-tight sm:text-[32px]">
          {value}
        </div>
        <div className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-[12px] ${deltaClass}`}>
          {delta}
        </div>
      </div>
      <div className="hidden h-8 items-end gap-0.5 sm:flex">
        {bars.map((b, j) => (
          <div
            key={j}
            className={`flex-1 rounded-[1px] ${barClass}`}
            style={{ height: b.height }}
          />
        ))}
      </div>
    </div>
  );
}

function eventLabel(type: string) {
  const map: Record<string, string> = {
    booking_click: "Agendamento",
    page_view: "Visita",
    product_view: "Produto visto",
    barber_view: "Barbeiro visto",
    whatsapp_checkout: "WhatsApp checkout",
  };
  return map[type] ?? type;
}

function eventIcon(type: string) {
  const map: Record<string, string> = {
    booking_click: "📅",
    page_view: "👁",
    product_view: "🛍",
    barber_view: "✂",
    whatsapp_checkout: "💬",
  };
  return map[type] ?? "•";
}

function startOfDayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}
