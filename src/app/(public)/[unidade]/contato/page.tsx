import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { getUnitBySlug } from "@/lib/data";
import { buildBreadcrumbJsonLd, buildUnitMetadata, buildUnitPageTitle } from "@/lib/seo";
import { TrackPageView } from "@/components/public/track-page-view";
import { BookingButton } from "@/components/public/booking-button";
import { formatPhonePT } from "@/lib/utils";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/public/social-icons";

type Params = { unidade: string };

const DAYS = [
  ["mon", "Segunda"],
  ["tue", "Terça"],
  ["wed", "Quarta"],
  ["thu", "Quinta"],
  ["fri", "Sexta"],
  ["sat", "Sábado"],
  ["sun", "Domingo"],
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { unidade } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) return {};
  return buildUnitMetadata(unit, {
    title: buildUnitPageTitle("Contacto", unit),
    description: `Morada, horários e contactos de ${unit.name}, em Leiria.`,
    path: `/${unit.slug}/contato`,
  });
}

export default async function ContatoPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { unidade } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) notFound();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: unit.name, path: `/${unit.slug}` },
    { name: "Contacto", path: `/${unit.slug}/contato` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TrackPageView unitId={unit.id} />

      {/* ── Page header ── */}
      <section className="border-b border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
            Contacto
          </p>
          <h1 className="font-heading text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Como nos encontrar.
          </h1>
          <p className="mt-4 max-w-xl text-[17px] text-muted-foreground">
            {unit.address
              ? `Estamos em ${unit.address}. Agende online ou fale connosco diretamente.`
              : "Agende online ou fale connosco diretamente."}
          </p>
        </div>
      </section>

      {/* ── Contact grid ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">

          {/* ── Info card ── */}
          <div className="col-span-1 space-y-6 rounded-2xl border border-border bg-card p-8 lg:col-span-2">
            <div className="grid gap-6 sm:grid-cols-2">

              {/* Address */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                  <MapPin className="h-3.5 w-3.5" />
                  Morada
                </div>
                {unit.address ? (
                  <p className="text-[15px] text-muted-foreground leading-relaxed">
                    {unit.address}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">A definir.</p>
                )}
                {unit.maps_url && (
                  <a
                    href={unit.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand transition hover:text-brand-hover"
                  >
                    Ver no Google Maps →
                  </a>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                  <Phone className="h-3.5 w-3.5" />
                  Telefone
                </div>
                {unit.phone ? (
                  <a
                    href={`tel:${unit.phone}`}
                    className="block text-[15px] text-muted-foreground transition hover:text-brand"
                  >
                    {formatPhonePT(unit.phone)}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </div>
                {unit.whatsapp ? (
                  <a
                    href={`https://wa.me/${unit.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[15px] text-muted-foreground transition hover:text-brand"
                  >
                    Falar no WhatsApp →
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>

              {/* Social */}
              {(unit.socials?.instagram ||
                unit.socials?.facebook ||
                unit.socials?.tiktok) && (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                    Social
                  </div>
                  <div className="flex gap-2">
                    {unit.socials?.instagram && (
                      <a
                        href={unit.socials.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-surface text-muted-foreground transition hover:bg-brand hover:text-[#1a1410]"
                      >
                        <InstagramIcon className="h-4 w-4" />
                      </a>
                    )}
                    {unit.socials?.facebook && (
                      <a
                        href={unit.socials.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-surface text-muted-foreground transition hover:bg-brand hover:text-[#1a1410]"
                      >
                        <FacebookIcon className="h-4 w-4" />
                      </a>
                    )}
                    {unit.socials?.tiktok && (
                      <a
                        href={unit.socials.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="TikTok"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-surface text-muted-foreground transition hover:bg-brand hover:text-[#1a1410]"
                      >
                        <TikTokIcon className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="border-t border-border pt-6">
              <BookingButton
                unit={unit}
                className="rounded-full px-8 py-3.5 text-[15px] font-semibold"
              />
            </div>
          </div>

          {/* ── Hours card ── */}
          <div className="rounded-2xl border border-border bg-bg-surface p-8">
            <div className="mb-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
              <Clock className="h-3.5 w-3.5" />
              Horário
            </div>
            <ul className="divide-y divide-border">
              {DAYS.map(([key, label]) => {
                const slot = unit.hours?.[key];
                const isOpen = slot?.open && slot?.close;
                return (
                  <li
                    key={key}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span
                      className={
                        isOpen
                          ? "text-sm text-muted-foreground"
                          : "text-sm text-muted-foreground/40"
                      }
                    >
                      {isOpen ? `${slot.open} – ${slot.close}` : "Fechado"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
