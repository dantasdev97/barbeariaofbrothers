import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { getUnitBySlug } from "@/lib/data";
import {
  buildBreadcrumbJsonLd,
  buildUnitMetadata,
  buildUnitPageTitle,
  notFoundMetadata,
} from "@/lib/seo";
import { TrackPageView } from "@/components/public/track-page-view";
import { BookingButton } from "@/components/public/booking-button";
import { formatPhonePT } from "@/lib/utils";
import { getServerI18n } from "@/lib/i18n/server";
import { interpolate } from "@/lib/i18n/dictionaries";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/public/social-icons";

type Params = { unidade: string };

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { unidade } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) return notFoundMetadata("Unidade não encontrada");
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
  const { dict: t } = await getServerI18n();

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
            {t.contato.eyebrow}
          </p>
          <h1 className="font-heading text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
            {t.contato.title}
          </h1>
          <p className="mt-4 max-w-xl text-[17px] text-muted-foreground">
            {unit.address
              ? interpolate(t.contato.subtitleWithAddress, { address: unit.address })
              : t.contato.subtitleNoAddress}
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
                  {t.contato.address}
                </div>
                {unit.address ? (
                  <p className="text-[15px] text-muted-foreground leading-relaxed">
                    {unit.address}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">{t.contato.notSet}</p>
                )}
                {unit.maps_url && (
                  <a
                    href={unit.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand transition hover:text-brand-hover"
                  >
                    {t.contato.mapsLink}
                  </a>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                  <Phone className="h-3.5 w-3.5" />
                  {t.contato.phone}
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
                  {t.contato.whatsapp}
                </div>
                {unit.whatsapp ? (
                  <a
                    href={`https://wa.me/${unit.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[15px] text-muted-foreground transition hover:text-brand"
                  >
                    {t.contato.whatsappLink}
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
                    {t.contato.social}
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
              {t.contato.hoursTitle}
            </div>
            <ul className="divide-y divide-border">
              {DAY_KEYS.map((key) => {
                const slot = unit.hours?.[key];
                const isOpen = slot?.open && slot?.close;
                return (
                  <li
                    key={key}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="text-sm font-medium">{t.contato.days[key]}</span>
                    <span
                      className={
                        isOpen
                          ? "text-sm text-muted-foreground"
                          : "text-sm text-muted-foreground/40"
                      }
                    >
                      {isOpen ? `${slot.open} – ${slot.close}` : t.contato.closed}
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
