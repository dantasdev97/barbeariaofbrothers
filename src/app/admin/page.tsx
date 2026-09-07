import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, Eye, Package, Scissors } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/admin-auth";
import { PageHeader } from "@/components/admin/page-header";
import { MetricCard } from "@/components/admin/metric-card";
import { pageLabelFromPath, shortUnitName } from "@/lib/event-labels";
import { staggerIndex } from "@/lib/motion";
import { ActivityFeed, type ActivityItem } from "./activity-feed";
import { TopPages, type TopPage } from "./top-pages";

/**
 * A barbearia é em Portugal e o servidor corre em UTC. Sem fuso explícito, a
 * actividade das 00h30 aparecia com a hora de ontem e "hoje" começava à uma
 * da manhã — o painel discordava do relógio de quem o estava a ler.
 */
const TZ = "Europe/Lisbon";
const timeFmt = new Intl.DateTimeFormat("pt-PT", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});
const shortDayFmt = new Intl.DateTimeFormat("pt-PT", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
});
const fullFmt = new Intl.DateTimeFormat("pt-PT", {
  timeZone: TZ,
  dateStyle: "long",
  timeStyle: "short",
});
/** "2026-09-07" no fuso de Lisboa — chave de agrupamento por dia. */
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });

const TREND_DAYS = 30;
const ACTIVITY_LIMIT = 14;

export default async function AdminDashboard() {
  const { profile } = await requireRole(["super_admin", "manager"]);
  if (profile.role === "barbeiro") redirect("/admin/operacao");
  const sb = await createClient();

  const todayStr = new Date().toLocaleDateString("pt-PT", {
    timeZone: TZ,
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
    { data: recentEvents },
    { data: trendEvents },
    { data: units },
  ] = await Promise.all([
    sb.from("barbers").select("*", { count: "exact", head: true }),
    sb.from("products").select("*", { count: "exact", head: true }),
    sb
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("type", "booking_click")
      .gte("created_at", startOfTodayISO()),
    sb
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("type", "booking_click")
      .gte("created_at", daysAgoISO(TREND_DAYS)),
    sb
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("type", "page_view")
      .gte("created_at", daysAgoISO(TREND_DAYS)),
    // Agendamentos ficam de fora do registo: o clique no botão de marcação já
    // tem cartão próprio em cima, e enchia a lista com a única linha que não
    // diz nada sobre o que a pessoa esteve a ver.
    sb
      .from("events")
      .select("id, type, ref_id, meta, unit_id, created_at")
      .neq("type", "booking_click")
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_LIMIT),
    // Série para os sparklines e para o ranking de páginas. Um registo por
    // evento — agregamos por dia no servidor porque a API REST do Supabase
    // não faz group by.
    sb
      .from("events")
      .select("type, meta, created_at")
      .in("type", ["booking_click", "page_view"])
      .gte("created_at", daysAgoISO(TREND_DAYS))
      .limit(5000),
    sb.from("units").select("id, name, slug"),
  ]);

  const bookingSeries = dailySeries(trendEvents, "booking_click", TREND_DAYS);
  const pageViewSeries = dailySeries(trendEvents, "page_view", TREND_DAYS);

  const unitById = new Map(
    (units ?? []).map((u) => [u.id, shortUnitName(u.name as string)]),
  );
  const unitSlugs = new Set((units ?? []).map((u) => u.slug as string));

  // ── Páginas mais vistas ──
  const pathCount = new Map<string, number>();
  for (const ev of trendEvents ?? []) {
    if (ev.type !== "page_view") continue;
    const path = safePath(ev.meta);
    if (!path) continue;
    pathCount.set(path, (pathCount.get(path) ?? 0) + 1);
  }
  const topPages: TopPage[] = Array.from(pathCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([path, views]) => ({
      path,
      label: pageLabelFromPath(path, unitSlugs),
      views,
    }));

  // ── Actividade recente ──
  // Os eventos guardam só um `ref_id`. Sem esta segunda ida à base, a tabela
  // mostrava oito caracteres de um UUID onde devia estar o nome do produto.
  const events = recentEvents ?? [];
  const productIds = [
    ...new Set(
      events
        .filter((e) => e.type === "product_view" || e.type === "add_to_cart")
        .map((e) => e.ref_id)
        .filter((id): id is string => !!id),
    ),
  ];
  const barberIds = [
    ...new Set(
      events
        .filter((e) => e.type === "barber_view")
        .map((e) => e.ref_id)
        .filter((id): id is string => !!id),
    ),
  ];

  const [{ data: products }, { data: barbers }] = await Promise.all([
    productIds.length
      ? sb.from("products").select("id, name, image_url").in("id", productIds)
      : Promise.resolve({ data: [] as ProductLite[] }),
    barberIds.length
      ? sb.from("barbers").select("id, name, photo_url").in("id", barberIds)
      : Promise.resolve({ data: [] as BarberLite[] }),
  ]);

  const productById = new Map(
    (products ?? []).map((p) => [p.id, p as ProductLite]),
  );
  const barberById = new Map(
    (barbers ?? []).map((b) => [b.id, b as BarberLite]),
  );

  const now = new Date();
  const todayKey = dayKeyFmt.format(now);
  const yesterdayKey = dayKeyFmt.format(new Date(now.getTime() - 86_400_000));

  const activity: ActivityItem[] = events.map((ev) => {
    const created = new Date(ev.created_at as string);
    const key = dayKeyFmt.format(created);
    const path = safePath(ev.meta);
    const type = ev.type as string;

    let title = path ? pageLabelFromPath(path, unitSlugs) : "Visita";
    let imageUrl: string | null = null;
    let fallback: ActivityItem["fallback"] = "page";

    if (type === "product_view" || type === "add_to_cart") {
      const p = ev.ref_id ? productById.get(ev.ref_id) : undefined;
      title = p?.name ?? "Produto";
      imageUrl = p?.image_url ?? null;
      fallback = type === "add_to_cart" ? "cart" : "product";
    } else if (type === "barber_view") {
      const b = ev.ref_id ? barberById.get(ev.ref_id) : undefined;
      title = b?.name ?? "Barbeiro";
      imageUrl = b?.photo_url ?? null;
      fallback = "barber";
    } else if (type === "whatsapp_checkout") {
      title = "Pedido enviado por WhatsApp";
      fallback = "chat";
    } else if (type === "loyalty_click") {
      title = "Programa de pontos";
      fallback = "gift";
    }

    return {
      id: String(ev.id),
      type,
      title,
      path,
      imageUrl,
      fallback,
      unitName: ev.unit_id
        ? (unitById.get(ev.unit_id) ?? null)
        : null,
      time: timeFmt.format(created),
      dayLabel:
        key === todayKey
          ? "hoje"
          : key === yesterdayKey
            ? "ontem"
            : shortDayFmt.format(created),
      fullDate: fullFmt.format(created),
    };
  });

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

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <ActivityFeed items={activity} />
        <TopPages rows={topPages} days={TREND_DAYS} />
      </div>
    </div>
  );
}

type ProductLite = { id: string; name: string; image_url: string | null };
type BarberLite = { id: string; name: string; photo_url: string | null };

/** Caracteres de controlo, que não existem num caminho verdadeiro. */
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

/**
 * Caminho de página guardado no evento, se for utilizável como link.
 *
 * `meta` vem de `POST /api/analytics`, que é público e não autenticado:
 * qualquer pessoa pode escrever lá o que quiser. Como o painel transforma
 * este valor num `href`, só passam caminhos internos — "/algo". Um
 * `javascript:` ou um `//exemplo.com` (que o browser lê como outro domínio)
 * ficam de fora.
 */
function safePath(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const value = (meta as { path?: unknown }).path;
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (CONTROL_CHARS.test(value)) return null;
  return value.slice(0, 180);
}

/**
 * Agrega eventos de um tipo em contagens diárias, do dia mais antigo ao mais
 * recente. Devolve sempre `days` pontos — dias sem eventos entram a zero,
 * senão o sparkline comprimia os intervalos e distorcia a leitura.
 *
 * Os dias são dias de Lisboa, não do relógio UTC do servidor: um evento das
 * 00h30 de hoje pertence a hoje, não a ontem.
 */
function dailySeries(
  events: Array<{ type: string | null; created_at: string }> | null,
  type: string,
  days: number,
): number[] {
  const buckets = new Array<number>(days).fill(0);
  if (!events) return buckets;

  // Índice "2026-09-07" → posição no array. Construído a partir da data de
  // hoje em Lisboa e recuando dias inteiros em UTC, que não escorrega na
  // mudança da hora.
  const [y, m, d] = dayKeyFmt.format(new Date()).split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  const index = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const key = new Date(base - (days - 1 - i) * 86_400_000)
      .toISOString()
      .slice(0, 10);
    index.set(key, i);
  }

  for (const ev of events) {
    if (ev.type !== type) continue;
    const i = index.get(dayKeyFmt.format(new Date(ev.created_at)));
    if (i !== undefined) buckets[i] += 1;
  }
  return buckets;
}

/** Instante em que começou o dia de hoje em Lisboa, em ISO/UTC. */
function startOfTodayISO(): string {
  const key = dayKeyFmt.format(new Date());
  const utcMidnight = new Date(`${key}T00:00:00Z`).getTime();
  // De quanto é que Lisboa está à frente de UTC nesse instante (0h ou 1h).
  const asLocal = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(utcMidnight));
  const offset =
    new Date(`${asLocal.replace(" ", "T")}Z`).getTime() - utcMidnight;
  return new Date(utcMidnight - offset).toISOString();
}

function daysAgoISO(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}
