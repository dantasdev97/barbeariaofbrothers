import type { Metadata } from "next";
import type { UnitRow } from "@/types/database.types";
import { absoluteUrl } from "@/lib/utils";

type PageSeo = {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
};

export function buildUnitMetadata(unit: UnitRow, page?: PageSeo): Metadata {
  const title = page?.title ?? unit.seo?.title ?? `${unit.name} — Barbearia em Leiria`;
  const description =
    page?.description ??
    unit.seo?.description ??
    `${unit.name} — corte, barba e estilo. Agende online ou descubra os nossos produtos.`;
  const path = page?.path ?? `/${unit.slug}`;
  const ogImage =
    page?.ogImage ??
    unit.seo?.og_image ??
    absoluteUrl(`/api/og/${unit.slug}`);

  return {
    title,
    description,
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

export function buildLocalBusinessJsonLd(unit: UnitRow) {
  return {
    "@context": "https://schema.org",
    "@type": "BarberShop",
    "@id": absoluteUrl(`/${unit.slug}#salon`),
    name: unit.name,
    description: "Barbearia profissional em Leiria. Corte, barba, degradê e estilo desde 2012.",
    image: unit.logo_url ?? absoluteUrl("/logo.png"),
    url: absoluteUrl(`/${unit.slug}`),
    telephone: unit.phone ?? unit.whatsapp ?? undefined,
    priceRange: "€€",
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
