import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, Eye, Package, Scissors } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/admin-auth";
import { PageHeader } from "@/components/admin/page-header";
import { MetricCard } from "@/components/admin/metric-card";
import { staggerIndex } from "@/lib/motion";

export default async function AdminDashboard() {
  const { profile } = await requireRole(["super_admin", "manager"]);
  if (profile.role === "barbeiro") redirect("/admin/operacao");
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
    { data: trendEvents },
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
    // Série para os sparklines. Um registo por evento — agregamos por dia
    // no servidor porque a API REST do Supabase não faz group by.
    sb
      .from("events")
      .select("type, created_at")
      .in("type", ["booking_click", "page_view"])
      .gte("created_at", daysAgoISO(30))
      .limit(5000),
  ]);

  const bookingSeries = dailySeries(trendEvents, "booking_click", 30);
  const pageViewSeries = dailySeries(trendEvents, "page_view", 30);

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
      <PageHeader
        title="Dashboard"
        description={`Visão geral das duas unidades · ${todayStr}`}
        actions={
          <Link
            href="/admin/barbeiros"
            className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-4 py-2.5 text-[13px] font-medium text-[#0e0a07] transition-[opacity,transform] duration-150 ease-out-strong hover:opacity-90 active:scale-[0.97]"
          >
            + Novo barbeiro
          </Link>
        }
      />

      {/* ── Stat cards ── */}
      <div className="stagger mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div {...staggerIndex(0)}>
          <MetricCard
            label="Agendamentos · hoje"
            value={bookingsTodayCount ?? 0}
            hint={`${bookings30dCount ?? 0} este mês`}
            tone="brand"
            icon={<CalendarCheck className="h-4 w-4" />}
            series={bookingSeries}
          />
        </div>
        <div {...staggerIndex(1)}>
          <MetricCard
            label="Visualizações · 30d"
            value={pageViews30d ?? 0}
            hint="page views"
            tone="green"
            icon={<Eye className="h-4 w-4" />}
            series={pageViewSeries}
          />
        </div>
        <div {...staggerIndex(2)}>
          <MetricCard
            label="Produtos"
            value={productsCount ?? 0}
            hint="no catálogo"
            tone="blue"
            icon={<Package className="h-4 w-4" />}
          />
        </div>
        <div {...staggerIndex(3)}>
          <MetricCard
            label="Barbeiros activos"
            value={barbersCount ?? 0}
            hint="2 unidades"
            tone="mute"
            icon={<Scissors className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* ── Content row ── */}
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
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
          <div className="hidden gap-3 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:grid md:grid-cols-[1.6fr_1.2fr_0.6fr_1fr]">
            <div>Tipo</div>
            <div>Referência</div>
            <div>Hora</div>
            <div>Estado</div>
          </div>

          {(recentActivity ?? []).length === 0 ? (
            <p className="px-6 py-10 text-sm text-muted-foreground">
              Sem eventos recentes.
            </p>
          ) : (
            <div className="stagger">
              {(recentActivity ?? []).map((ev, i) => {
                const d = new Date(ev.created_at as string);
                const timeStr = d.toLocaleTimeString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const isBooking = ev.type === "booking_click";
                return (
                  <div
                    key={ev.id}
                    {...staggerIndex(i)}
                    className="grid gap-2 border-t border-border px-4 py-4 text-sm transition-colors duration-150 hover-fine:hover:bg-background sm:px-6 md:grid-cols-[1.6fr_1.2fr_0.6fr_1fr] md:items-center md:gap-3 md:py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background text-xs">
                        {eventIcon(ev.type as string)}
                      </div>
                      <span className="text-[13px] font-medium">
                        {eventLabel(ev.type as string)}
                      </span>
                    </div>
                    <div className="truncate font-mono text-[12.5px] text-muted-foreground">
                      {ev.ref_id ? ev.ref_id.slice(0, 8) + "…" : "—"}
                    </div>
                    <div className="font-mono text-[12.5px] text-muted-foreground tabular-nums">
                      {timeStr}
                    </div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          isBooking
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-brand/10 text-brand"
                        }`}
                      >
                        {isBooking ? "● Agendamento" : "◌ Visita"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
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
              <div className="stagger">
                {topBarbers.map((b, i) => (
                  <div
                    key={b.name}
                    {...staggerIndex(i)}
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
                          className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out-strong"
                          style={{
                            width: `${Math.round((b.views / maxViews) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Agrega eventos de um tipo em contagens diárias, do dia mais antigo ao mais
 * recente. Devolve sempre `days` pontos — dias sem eventos entram a zero,
 * senão o sparkline comprimia os intervalos e distorcia a leitura.
 */
function dailySeries(
  events: Array<{ type: string | null; created_at: string }> | null,
  type: string,
  days: number,
): number[] {
  const buckets = new Array<number>(days).fill(0);
  if (!events) return buckets;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const dayMs = 86_400_000;

  for (const ev of events) {
    if (ev.type !== type) continue;
    // Normalizar ao início do dia do evento antes de comparar: sem isto, um
    // evento de hoje dá uma diferença negativa e cai fora do array.
    const evDay = new Date(ev.created_at);
    evDay.setHours(0, 0, 0, 0);
    // 0 = hoje, 1 = ontem, … Índice no array conta ao contrário (antigo → novo).
    const daysAgo = Math.round((startOfToday.getTime() - evDay.getTime()) / dayMs);
    const index = days - 1 - daysAgo;
    if (index >= 0 && index < days) buckets[index] += 1;
  }
  return buckets;
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
