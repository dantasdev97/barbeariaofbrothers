import { Calendar, MapPin, Package, Scissors } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MetricCard } from "@/components/admin/metric-card";


export default async function AdminDashboard() {
  const sb = await createClient();

  const [
    { count: barbersCount },
    { count: productsCount },
    { count: unitsCount },
    { data: bookingsToday },
    { data: bookings30d },
    { data: pageViewsToday },
    { data: topProducts },
    { data: topBarbers },
  ] = await Promise.all([
    sb.from("barbers").select("*", { count: "exact", head: true }),
    sb.from("products").select("*", { count: "exact", head: true }),
    sb.from("units").select("*", { count: "exact", head: true }).eq("active", true),
    sb
      .from("events")
      .select("id", { count: "exact" })
      .eq("type", "booking_click")
      .gte("created_at", startOfDayISO()),
    sb
      .from("events")
      .select("id", { count: "exact" })
      .eq("type", "booking_click")
      .gte("created_at", daysAgoISO(30)),
    sb
      .from("events")
      .select("id", { count: "exact" })
      .eq("type", "page_view")
      .gte("created_at", startOfDayISO()),
    sb
      .from("events")
      .select("ref_id, type")
      .eq("type", "product_view")
      .gte("created_at", daysAgoISO(30))
      .limit(500),
    sb
      .from("events")
      .select("ref_id, type")
      .eq("type", "barber_view")
      .gte("created_at", daysAgoISO(30))
      .limit(500),
  ]);

  const topProductMap = countByRefId(topProducts ?? []);
  const topBarberMap = countByRefId(topBarbers ?? []);

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral das suas barbearias.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={MapPin}
          label="Unidades activas"
          value={unitsCount ?? 0}
        />
        <MetricCard
          icon={Scissors}
          label="Barbeiros"
          value={barbersCount ?? 0}
        />
        <MetricCard
          icon={Package}
          label="Produtos"
          value={productsCount ?? 0}
        />
        <MetricCard
          icon={Calendar}
          label="Agendamentos (hoje)"
          value={bookingsToday?.length ?? 0}
          hint={`${bookings30d?.length ?? 0} nos últimos 30 dias`}
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-bg-surface p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold">
            Páginas vistas hoje
          </h2>
          <p className="text-4xl font-bold text-brand">
            {pageViewsToday?.length ?? 0}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Eventos do tipo <code>page_view</code> nas últimas 24h.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-bg-surface p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold">
            Top produtos (30d)
          </h2>
          <ListTop entries={topProductMap} empty="Sem visualizações ainda." />
        </div>

        <div className="rounded-2xl border border-white/10 bg-bg-surface p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold">
            Top barbeiros (30d)
          </h2>
          <ListTop entries={topBarberMap} empty="Sem visualizações ainda." />
        </div>
      </div>
    </div>
  );
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
function countByRefId(rows: { ref_id: string | null }[]) {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (!r.ref_id) continue;
    map.set(r.ref_id, (map.get(r.ref_id) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

function ListTop({
  entries,
  empty,
}: {
  entries: [string, number][];
  empty: string;
}) {
  if (entries.length === 0)
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2">
      {entries.map(([id, count]) => (
        <li
          key={id}
          className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2 text-sm"
        >
          <span className="font-mono text-xs text-muted-foreground">
            {id.slice(0, 8)}…
          </span>
          <span className="font-semibold text-brand">{count}</span>
        </li>
      ))}
    </ul>
  );
}
