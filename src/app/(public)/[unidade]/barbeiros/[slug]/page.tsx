import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Scissors } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
} from "@/components/public/social-icons";
import { getBarberBySlug, getUnitBySlug } from "@/lib/data";
import { buildUnitMetadata } from "@/lib/seo";
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
    title: `${b.name} — ${unit.name}`,
    description: b.description ?? b.speciality ?? `Agende com ${b.name}.`,
    path: `/${unit.slug}/barbeiros/${b.slug}`,
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

  return (
    <>
      <TrackPageView unitId={unit.id} type="barber_view" refId={b.id} />
      <article className="container-page py-12">
        <Link
          href={`/${unit.slug}/barbeiros`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos barbeiros
        </Link>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 bg-bg-surface shadow-premium-lg">
            {b.photo_url ? (
              <Image
                src={b.photo_url}
                alt={b.name}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Scissors className="h-20 w-20 text-brand" />
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            {b.speciality && (
              <span className="text-xs uppercase tracking-[0.2em] text-brand">
                {b.speciality}
              </span>
            )}
            <h1 className="mt-2 font-heading text-4xl font-semibold sm:text-5xl">
              {b.name}
            </h1>
            {b.description && (
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                {b.description}
              </p>
            )}

            {(b.socials?.instagram || b.socials?.facebook) && (
              <div className="mt-6 flex gap-2">
                {b.socials?.instagram && (
                  <a
                    href={b.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition hover:bg-brand hover:text-primary-foreground"
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
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition hover:bg-brand hover:text-primary-foreground"
                  >
                    <FacebookIcon className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}

            <div className="mt-8">
              <BookingButton unit={unit} barber={b} className="px-6 py-6 text-base" />
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
