import type { Metadata } from "next";
import type { UnitRow } from "@/types/database.types";
import { absoluteUrl } from "@/lib/utils";
import { LOCALES } from "@/lib/i18n/config";

type PageSeo = {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
};

/** Ordered by real Search Console ranking — "barbearia leiria" leads every page. */
export const KEYWORDS = [
  "barbearia leiria",
  "barbeiro leiria",
  "corte de cabelo leiria",
  "barba leiria",
  "degradê leiria",
  "barbearia of brothers",
];

export function homeMetadata(): Metadata {
  const title = "Barbearia em Leiria | Of Brothers — Desde 2012";
  const description =
    "Barbearia em Leiria desde 2012. Escolha a sua unidade Of Brothers para agendar, conhecer a equipa e ver produtos.";

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

const SERVICES = [
  "Corte de cabelo",
  "Barba",
  "Degradê",
  "Sobrancelha",
  "Navalha",
  "Pigmentação",
];

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
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      bestRating: "5",
      ratingCount: "120",
    },
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
