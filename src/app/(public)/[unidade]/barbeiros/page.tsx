import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Scissors } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
} from "@/components/public/social-icons";
import { getBarbersByUnit, getUnitBySlug } from "@/lib/data";
import { buildUnitMetadata } from "@/lib/seo";
import { BookingButton } from "@/components/public/booking-button";
import { TrackPageView } from "@/components/public/track-page-view";

type Params = { unidade: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { unidade } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) return {};
  return buildUnitMetadata(unit, {
    title: `Barbeiros — ${unit.name}`,
    description: `Conheça a equipa de ${unit.name}.`,
    path: `/${unit.slug}/barbeiros`,
  });
}

export default async function BarbeirosPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { unidade } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) notFound();
  const barbers = await getBarbersByUnit(unit.id);

  return (
    <>
      <TrackPageView unitId={unit.id} />
      <section className="container-page py-12 sm:py-16">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs uppercase tracking-[0.2em] text-brand">
            A nossa equipa
          </span>
          <h1 className="mt-2 font-heading text-4xl font-semibold sm:text-5xl">
            Barbeiros
          </h1>
          <p className="mt-3 text-muted-foreground">
            Profissionais com anos de experiência, prontos para o atender.
          </p>
        </div>

        {barbers.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-bg-surface p-10 text-center text-muted-foreground">
            Em breve a nossa equipa estará disponível aqui.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {barbers.map((b) => (
              <article
                key={b.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-bg-surface transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-premium-lg"
              >
                <Link
                  href={`/${unit.slug}/barbeiros/${b.slug}`}
                  className="relative aspect-[4/5] overflow-hidden"
                >
                  {b.photo_url ? (
                    <Image
                      src={b.photo_url}
                      alt={b.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-bg-surface to-background">
                      <Scissors className="h-12 w-12 text-brand" />
                    </div>
                  )}
                </Link>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div>
                    <h3 className="font-heading text-xl font-semibold">{b.name}</h3>
                    {b.speciality && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {b.speciality}
                      </p>
                    )}
                  </div>

                  {(b.socials?.instagram || b.socials?.facebook) && (
                    <div className="flex gap-2">
                      {b.socials?.instagram && (
                        <a
                          href={b.socials.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Instagram"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 transition hover:bg-brand hover:text-primary-foreground"
                        >
                          <InstagramIcon className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {b.socials?.facebook && (
                        <a
                          href={b.socials.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Facebook"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 transition hover:bg-brand hover:text-primary-foreground"
                        >
                          <FacebookIcon className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-2">
                    <BookingButton unit={unit} barber={b} className="w-full" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
