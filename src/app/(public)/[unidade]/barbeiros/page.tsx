import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBarbersByUnit, getUnitBySlug } from "@/lib/data";
import { buildUnitMetadata } from "@/lib/seo";
import { BookingButton } from "@/components/public/booking-button";
import { TrackPageView } from "@/components/public/track-page-view";
import {
  FacebookIcon,
  InstagramIcon,
} from "@/components/public/social-icons";

type Params = { unidade: string };

const BARBER_GRADIENTS = [
  "linear-gradient(135deg, #1a1410, #3a302a)",
  "linear-gradient(135deg, #3a302a, #5a4a3e)",
  "linear-gradient(135deg, #2a221c, #4a3d34)",
  "linear-gradient(135deg, #F39200, #d97e00)",
  "linear-gradient(135deg, #0a1f2d, #1a3d4f)",
  "linear-gradient(135deg, #1a2d0a, #2e4a15)",
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
    description: `Conheça a equipa de ${unit.name}. Profissionais certificados, prontos para o atender.`,
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

      {/* ── Page header ── */}
      <section className="border-b border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
            A equipa
          </p>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-heading text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Os nossos barbeiros.
              </h1>
              <p className="mt-4 max-w-xl text-[17px] text-muted-foreground">
                Profissionais certificados com anos de experiência. Escolhe um e
                agenda diretamente online.
              </p>
            </div>
            <BookingButton
              unit={unit}
              className="shrink-0 rounded-full px-7 py-3.5 text-[15px]"
            />
          </div>
        </div>
      </section>

      {/* ── Barbers grid ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {barbers.length === 0 ? (
            <div className="rounded-2xl border border-border bg-bg-surface p-16 text-center">
              <p className="text-lg text-muted-foreground">
                Em breve a nossa equipa estará disponível aqui.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {barbers.map((b, i) => {
                const gradient = BARBER_GRADIENTS[i % BARBER_GRADIENTS.length];
                const initials = getInitials(b.name);
                const firstName = b.name.split(" ")[0];

                return (
                  <article
                    key={b.id}
                    className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_24px_50px_-24px_rgba(26,20,16,0.2)]"
                  >
                    {/* Photo / initials */}
                    <Link
                      href={`/${unit.slug}/barbeiros/${b.slug}`}
                      className="relative flex aspect-[4/5] items-center justify-center overflow-hidden"
                      style={{ background: gradient }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(45deg, transparent 0 12px, rgba(255,255,255,0.06) 12px 13px)",
                        }}
                      />
                      {b.photo_url ? (
                        <Image
                          src={b.photo_url}
                          alt={b.name}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="relative font-heading text-[96px] font-bold tracking-tighter text-white/90">
                          {initials}
                        </span>
                      )}
                    </Link>

                    {/* Card body */}
                    <div className="p-6">
                      {b.speciality && (
                        <span className="mb-3 inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                          {b.speciality}
                        </span>
                      )}
                      <h3 className="font-heading text-[26px] font-semibold tracking-tight">
                        {b.name}
                      </h3>
                      {b.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {b.description}
                        </p>
                      )}
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <BookingButton
                          unit={unit}
                          barber={b}
                          label={`Agendar com ${firstName}`}
                          className="rounded-full px-4 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                          {b.socials?.instagram && (
                            <a
                              href={b.socials.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Instagram"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bg-surface text-muted-foreground transition hover:bg-brand hover:text-[#1a1410]"
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
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bg-surface text-muted-foreground transition hover:bg-brand hover:text-[#1a1410]"
                            >
                              <FacebookIcon className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
