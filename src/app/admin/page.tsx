import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, Eye, Package, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/admin-auth";
import { PageHeader } from "@/components/admin/page-header";
import { MetricCard } from "@/components/admin/metric-card";
import { DateFilter } from "@/components/admin/date-filter";
import { Pagination } from "@/components/admin/pagination";
import { pageLabelFromPath, shortUnitName } from "@/lib/event-labels";
import { dailySeries, dayKey, resolveRange, shiftDayKey, TZ } from "@/lib/date-range";
import { staggerIndex } from "@/lib/motion";
import type { EventType } from "@/types/database.types";
import { ActivityFeed, type ActivityItem } from "./activity-feed";
import { TopPages, type TopPage } from "./top-pages";

type SearchParams = {
  dias?: string;
  de?: string;
  ate?: string;
  page?: string;
};

export const dynamic = "force-dynamic";

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

/** Eventos por página no registo de actividade. */
const ACTIVITY_PAGE_SIZE = 10;
/**
 * Tecto da leitura que alimenta os gráficos e o ranking de páginas. Acima
 * disto a série fica truncada — é o compromisso de agregar na aplicação em
 * vez de na base (a API REST do Supabase não faz group by), e o painel
 * di-lo em voz alta em vez de mostrar números a menos sem avisar.
 */
const SERIES_LIMIT = 5000;

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { profile } = await requireRole(["super_admin", "manager"]);
  if (profile.role === "barbeiro") redirect("/admin/operacao");
  const sb = await createClient();

  const sp = await searchParams;
  const range = resolveRange(sp);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const todayStr = new Date().toLocaleDateString("pt-PT", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /** Contagem exacta de um tipo de evento dentro do intervalo. */
  const countOf = (type: EventType) =>
    sb
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("type", type)
      .gte("created_at", range.fromISO)
      .lt("created_at", range.toISO);

  const [
    { count: bookings },
    { count: pageViews },
    { count: productViews },
    { count: addToCart },
    { data: recentEvents, count: activityTotal },
    { data: trendEvents },
    { data: units },
  ] = await Promise.all([
    countOf("booking_click"),
    countOf("page_view"),
    countOf("product_view"),
    countOf("add_to_cart"),
    // Agendamentos ficam de fora do registo: o clique no botão de marcação já
    // tem cartão próprio em cima, e enchia a lista com a única linha que não
    // diz nada sobre o que a pessoa esteve a ver.
    sb
      .from("events")
      .select("id, type, ref_id, meta, unit_id, created_at", { count: "exact" })
      .neq("type", "booking_click")
      .gte("created_at", range.fromISO)
      .lt("created_at", range.toISO)
      .order("created_at", { ascending: false })
      .range((page - 1) * ACTIVITY_PAGE_SIZE, page * ACTIVITY_PAGE_SIZE - 1),
    // Uma leitura para os quatro gráficos e para o ranking de páginas.
    sb
      .from("events")
      .select("type, meta, created_at")
      .in("type", ["booking_click", "page_view", "product_view", "add_to_cart"])
      .gte("created_at", range.fromISO)
      .lt("created_at", range.toISO)
      .limit(SERIES_LIMIT),
    sb.from("units").select("id, name, slug"),
  ]);

  const total = activityTotal ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE));
  // Página pedida à mão além do fim: em vez de um registo vazio com 300
  // eventos no intervalo, volta-se à última página real.
  if (page > pageCount && total > 0) {
    const qs = new URLSearchParams(range.params as Record<string, string>);
    if (pageCount > 1) qs.set("page", String(pageCount));
    redirect(`/admin${qs.toString() ? `?${qs}` : ""}`);
  }

  const trend = (trendEvents ?? []) as Array<{
    type: string;
    meta: unknown;
    created_at: string;
  }>;
  const seriesOf = (type: string) =>
    dailySeries(
      trend.filter((e) => e.type === type),
      range,
      (e) => e.created_at,
    );

  const unitById = new Map(
    (units ?? []).map((u) => [u.id, shortUnitName(u.name as string)]),
  );
  const unitSlugs = new Set((units ?? []).map((u) => u.slug as string));

  // ── Páginas mais vistas ──
  const pathCount = new Map<string, number>();
  for (const ev of trend) {
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

  const todayKey = dayKey();
  const yesterdayKey = shiftDayKey(todayKey, -1);

  const activity: ActivityItem[] = events.map((ev) => {
    const created = new Date(ev.created_at as string);
    const key = dayKey(created);
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
      unitName: ev.unit_id ? (unitById.get(ev.unit_id) ?? null) : null,
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

  const periodLabel = range.label;
  const truncated = trend.length >= SERIES_LIMIT;

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

      <DateFilter range={range} basePath="/admin" />

      {/* ── Stat cards ──
       * Os quatro seguem o filtro e contam o mesmo percurso, por ordem: quem
       * chegou ao site, quem abriu a ficha de um produto, quem o pôs no
       * carrinho e quem foi marcar. */}
      <div className="stagger mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div {...staggerIndex(0)}>
          <MetricCard
            label={`Agendamentos · ${periodLabel}`}
            value={bookings ?? 0}
            hint="cliques em marcar"
            tone="brand"
            icon={<CalendarCheck className="h-4 w-4" />}
            series={seriesOf("booking_click")}
          />
        </div>
        <div {...staggerIndex(1)}>
          <MetricCard
            label={`Visualizações · ${periodLabel}`}
            value={pageViews ?? 0}
            hint="páginas vistas"
            tone="green"
            icon={<Eye className="h-4 w-4" />}
            series={seriesOf("page_view")}
          />
        </div>
        <div {...staggerIndex(2)}>
          <MetricCard
            label={`Produtos vistos · ${periodLabel}`}
            value={productViews ?? 0}
            hint="fichas abertas"
            tone="blue"
            icon={<Package className="h-4 w-4" />}
            series={seriesOf("product_view")}
          />
        </div>
        <div {...staggerIndex(3)}>
          <MetricCard
            label={`Carrinho · ${periodLabel}`}
            value={addToCart ?? 0}
            hint="produtos adicionados"
            tone="mute"
            icon={<ShoppingCart className="h-4 w-4" />}
            series={seriesOf("add_to_cart")}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr] xl:items-start">
        {/* `min-w-0`: sem isto o item da grelha assume como largura mínima a
         * do conteúdo, e o caminho da página (que não quebra) empurrava a
         * hora para fora do cartão no telemóvel. */}
        <div className="min-w-0">
          <ActivityFeed
            items={activity}
            subtitle={`Páginas vistas, produtos e barbeiros · ${periodLabel}`}
          />
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={ACTIVITY_PAGE_SIZE}
            basePath="/admin"
            params={range.params}
            noun={["evento", "eventos"]}
          />
        </div>

        <TopPages rows={topPages} subtitle={periodLabel} truncated={truncated} />
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
