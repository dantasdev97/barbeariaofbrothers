import type { Metadata } from "next";
import type { ProductRow, UnitRow } from "@/types/database.types";
import { absoluteUrl } from "@/lib/utils";
import { LOCALES } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";

type PageSeo = {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
};

/**
 * Data da última revisão dos textos legais. Fonte única para o `lastModified`
 * do sitemap e para a data mostrada em `/privacidade` e `/termos`, para que a
 * cópia visível e o sitemap não possam divergir.
 */
export const LEGAL_UPDATED = new Date("2026-05-14T00:00:00Z");

export const LEGAL_UPDATED_LABEL = "14 de maio de 2026";

/** Ordered by real Search Console ranking — "barbearia leiria" leads every page. */
export const KEYWORDS = [
  "barbearia leiria",
  "barbeiro leiria",
  "corte de cabelo leiria",
  "barba leiria",
  "degradê leiria",
  "barbearia of brothers",
];

/**
 * Builder central de metadata. Todas as páginas fora da árvore de unidades
 * devem passar por aqui.
 *
 * `path` e `index` são obrigatórios de propósito: o root layout já não declara
 * `alternates.canonical`, porque no App Router esse campo é herdado por todas as
 * rotas que não o sobrescrevam — foi assim que páginas legais, admin, login e
 * todos os 404 passaram a declarar a homepage como canónico. Tornar os dois
 * campos obrigatórios faz com que esquecer-se deles seja um erro de compilação
 * em vez de um bug silencioso em produção.
 */
export function buildPageMetadata({
  path,
  index,
  title,
  description,
  ogImage,
}: {
  /** Caminho absoluto a partir da raiz, ex. `/privacidade`. Vira canonical. */
  path: string;
  /** Decisão explícita de indexação. Sem default — tem de ser escolhida. */
  index: boolean;
  title?: string;
  description?: string;
  ogImage?: string;
}): Metadata {
  const canonical = absoluteUrl(path);

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      url: canonical,
      siteName: "Barbearia Of Brothers",
      locale: "pt_PT",
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
  };
}

/**
 * Metadata para respostas 404. Um 404 nunca deve declarar-se indexável nem
 * apontar o canonical para outra página — em produção isto estava a fazer com
 * que cada URL partido dissesse ao Google que era a homepage.
 */
export function notFoundMetadata(title = "Página não encontrada"): Metadata {
  return {
    title,
    alternates: { canonical: null },
    robots: { index: false, follow: false },
  };
}

export function homeMetadata(): Metadata {
  const title = "Barbearia em Leiria | Of Brothers — Desde 2012";
  const description =
    "Barbearia em Leiria desde 2012. Corte, barba, degradê e navalha por uma equipa certificada, em duas unidades. Agende online.";

  return {
    title: { absolute: title },
    description,
    keywords: KEYWORDS,
    alternates: { canonical: absoluteUrl("/") },
    openGraph: {
      title,
      description,
      url: absoluteUrl("/"),
      siteName: "Barbearia Of Brothers",
      locale: "pt_PT",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Keeps the "Barbearia em Leiria" keyword on inner pages, not just the unit home. */
export function buildUnitPageTitle(label: string, unit: UnitRow): string {
  return `${label} — Barbearia em Leiria (${unit.name})`;
}

export function buildUnitMetadata(unit: UnitRow, page?: PageSeo): Metadata {
  const title =
    page?.title ?? unit.seo?.title ?? `Barbearia em Leiria — ${unit.name}`;
  const description =
    page?.description ??
    unit.seo?.description ??
    `Barbearia em Leiria · ${unit.name} — corte, barba e estilo. Agende online ou descubra os nossos produtos.`;
  const path = page?.path ?? `/${unit.slug}`;
  const ogImage =
    page?.ogImage ??
    unit.seo?.og_image ??
    absoluteUrl(`/api/og/${unit.slug}`);

  return {
    title,
    description,
    keywords: KEYWORDS,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: "Barbearia Of Brothers",
      locale: "pt_PT",
      type: "website",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

const JSON_LD_LOCALES = LOCALES.map((l) => (l === "pt" ? "pt-PT" : l));

/**
 * Fonte única dos serviços, partilhada entre o `makesOffer` do JSON-LD e a
 * secção visível da homepage — antes existiam três listas dessincronizadas
 * (esta, o `marquee` do dicionário e a tabela `loyalty_services`).
 *
 * Usa sempre a versão `pt`: o JSON-LD é emitido em pt-PT, tal como o `og:locale`.
 */
const SERVICES = dictionaries.pt.homeLanding.services;

export function buildLocalBusinessJsonLd(unit: UnitRow) {
  return {
    "@context": "https://schema.org",
    "@type": ["BarberShop", "HairSalon"],
    "@id": absoluteUrl(`/${unit.slug}#salon`),
    name: unit.name,
    description: "Barbearia profissional em Leiria. Corte, barba, degradê e estilo desde 2012.",
    image: unit.logo_url ?? absoluteUrl("/logo.png"),
    url: absoluteUrl(`/${unit.slug}`),
    telephone: unit.phone ?? unit.whatsapp ?? undefined,
    priceRange: "€€",
    areaServed: { "@type": "City", name: "Leiria" },
    availableLanguage: JSON_LD_LOCALES,
    address: unit.address
      ? {
          "@type": "PostalAddress",
          streetAddress: unit.address,
          addressLocality: "Leiria",
          addressRegion: "Leiria",
          addressCountry: "PT",
        }
      : undefined,
    // Sem `aggregateRating`: estava fixo em 4.9/120 para todas as unidades, sem
    // qualquer avaliação visível na página. Marcação de avaliações não
    // verificáveis viola a política de dados estruturados do Google e arrisca
    // ação manual. Só voltar quando houver avaliações reais renderizadas.
    sameAs: [
      unit.socials?.instagram,
      unit.socials?.facebook,
      unit.socials?.tiktok,
    ].filter(Boolean),
    openingHours: hoursToOpeningHours(unit.hours ?? null),
    makesOffer: SERVICES.map((name) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name },
    })),
  };
}

/**
 * JSON-LD `Product` + `Offer` para as páginas de produto, que já mostram preço
 * e disponibilidade mas não os expunham em marcação nenhuma.
 *
 * Sem `aggregateRating`/`review`: só devem entrar quando houver avaliações
 * reais e visíveis na página.
 */
export function buildProductJsonLd(unit: UnitRow, product: ProductRow) {
  const url = absoluteUrl(`/${unit.slug}/produtos/${product.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description:
      product.seo_description ??
      product.description ??
      `${product.name} — à venda na ${unit.name}, em Leiria.`,
    image: product.image_url ?? undefined,
    sku: product.slug,
    // `price_cents: 0` é renderizado como "Sob consulta" na página. Emitir uma
    // Offer nesse caso anunciaria €0,00 ao Google, por isso omite-se.
    ...(product.price_cents > 0
      ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "EUR",
            price: (product.price_cents / 100).toFixed(2),
            itemCondition: "https://schema.org/NewCondition",
            availability:
              product.out_of_stock || product.stock <= 0
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            seller: { "@type": "Organization", name: unit.name },
          },
        }
      : {}),
  };
}

/**
 * JSON-LD da homepage.
 *
 * A homepage é o URL com mais autoridade do domínio e não tinha marcação
 * nenhuma. Emite a marca como `Organization` e aponta para as lojas pelos `@id`
 * que `buildLocalBusinessJsonLd` já emite em cada página de unidade — em vez de
 * redefinir as lojas aqui e arriscar que as duas definições divirjam.
 *
 * Sem `aggregateRating`, pelas razões documentadas acima.
 */
export function buildOrganizationJsonLd(units: UnitRow[]) {
  const sameAs = [
    ...new Set(
      units.flatMap((u) =>
        [u.socials?.instagram, u.socials?.facebook, u.socials?.tiktok].filter(
          Boolean,
        ),
      ),
    ),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: "Barbearia Of Brothers",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/logo.png"),
    description:
      "Barbearia em Leiria desde 2012. Corte, barba, degradê e acabamentos de precisão.",
    areaServed: { "@type": "City", name: "Leiria" },
    foundingDate: "2012",
    ...(sameAs.length ? { sameAs } : {}),
    subOrganization: units.map((u) => ({
      "@type": "BarberShop",
      "@id": absoluteUrl(`/${u.slug}#salon`),
      name: u.name,
      url: absoluteUrl(`/${u.slug}`),
    })),
  };
}

export type BreadcrumbItem = { name: string; path: string };

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const SCHEMA_DAY = {
  mon: "Mo",
  tue: "Tu",
  wed: "We",
  thu: "Th",
  fri: "Fr",
  sat: "Sa",
  sun: "Su",
} as const;

function hoursToOpeningHours(hours: UnitRow["hours"]) {
  if (!hours) return undefined;
  const parts: string[] = [];
  for (const day of DAY_KEYS) {
    const slot = hours[day];
    if (slot?.open && slot?.close) {
      parts.push(`${SCHEMA_DAY[day]} ${slot.open}-${slot.close}`);
    }
  }
  return parts.length ? parts : undefined;
}
