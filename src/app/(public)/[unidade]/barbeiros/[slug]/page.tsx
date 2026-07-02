import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/public/social-icons";
import { getBarberBySlug, getUnitBySlug } from "@/lib/data";
import { buildBreadcrumbJsonLd, buildUnitMetadata, buildUnitPageTitle } from "@/lib/seo";
import { BookingButton } from "@/components/public/booking-button";
import { TrackPageView } from "@/components/public/track-page-view";

type Params = { unidade: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { unidade, slug } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) return {};
  const b = await getBarberBySlug(unit.id, slug);
  if (!b) return {};
  return buildUnitMetadata(unit, {
    title: buildUnitPageTitle(b.name, unit),
    description:
      b.description ?? b.speciality ?? `Agende com ${b.name} na ${unit.name}, em Leiria.`,
    path: `/${unit.slug}/barbeiros/${b.slug}`,
    ogImage: b.photo_url ?? undefined,
  });
}

export default async function BarberDetail({
  params,
}: {
  params: Promise<Params>;
}) {
  const { unidade, slug } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) notFound();
  const b = await getBarberBySlug(unit.id, slug);
  if (!b) notFound();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: unit.name, path: `/${unit.slug}` },
    { name: "Barbeiros", path: `/${unit.slug}/barbeiros` },
    { name: b.name, path: `/${unit.slug}/barbeiros/${b.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TrackPageView unitId={unit.id} type="barber_view" refId={b.id} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href={`/${unit.slug}/barbeiros`}
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos barbeiros
        </Link>

        <article className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          {/* Photo */}
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card">
            {b.photo_url ? (
              <Image
                src={b.photo_url}
                alt={b.name}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div
                className="flex h-full items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #1a1410, #2d2218)",
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent 0 12px, rgba(255,255,255,0.05) 12px 13px)",
                }}
              >
                <span className="font-heading text-[120px] font-bold tracking-tighter text-white/80">
                  {b.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pt-2">
            {b.speciality && (
              <span className="mb-4 inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                {b.speciality}
              </span>
            )}
            <h1 className="font-heading text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
              {b.name}
            </h1>

            {b.description && (
              <p className="mt-6 text-[17px] leading-relaxed text-muted-foreground">
                {b.description}
              </p>
            )}

            {/* Social */}
            {(b.socials?.instagram || b.socials?.facebook || b.socials?.tiktok) && (
              <div className="mt-8 flex gap-3">
                {b.socials?.instagram && (
                  <a
                    href={b.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-bg-surface text-muted-foreground transition hover:bg-brand hover:text-[#1a1410]"
                  >
                    <InstagramIcon className="h-4 w-4" />
                  </a>
                )}
                {b.socials?.facebook && (
                  <a
                    href={b.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-bg-surface text-muted-foreground transition hover:bg-brand hover:text-[#1a1410]"
                  >
                    <FacebookIcon className="h-4 w-4" />
                  </a>
                )}
                {b.socials?.tiktok && (
                  <a
                    href={b.socials.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-bg-surface text-muted-foreground transition hover:bg-brand hover:text-[#1a1410]"
                  >
                    <TikTokIcon className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}

            {/* Booking CTA */}
            <div className="mt-10 rounded-2xl border border-border bg-bg-surface p-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Agenda diretamente com {b.name.split(" ")[0]} e escolhe o dia e
                hora que preferes.
              </p>
              <BookingButton
                unit={unit}
                barber={b}
                label={`Agendar com ${b.name.split(" ")[0]} →`}
                className="w-full rounded-xl py-3.5 text-base font-semibold"
              />
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
