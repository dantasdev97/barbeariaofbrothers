import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import {
  getBarbersByUnit,
  getProductsByUnit,
  getUnitBySlug,
} from "@/lib/data";
import { BookingButton } from "@/components/public/booking-button";
import { TrackPageView } from "@/components/public/track-page-view";
import { formatPrice, formatPriceOrAsk } from "@/lib/utils";
import { getServerI18n } from "@/lib/i18n/server";
import { interpolate } from "@/lib/i18n/dictionaries";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import { MarqueeBand } from "@/components/public/sections/marquee-band";
import { WhyUs } from "@/components/public/sections/why-us";

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

const yearsOpen = new Date().getFullYear() - 2012;

export default async function UnitHome({
  params,
}: {
  params: Promise<{ unidade: string }>;
}) {
  const { unidade } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) notFound();

  const [barbers, products, { dict: t }] = await Promise.all([
    getBarbersByUnit(unit.id),
    getProductsByUnit(unit.id),
    getServerI18n(),
  ]);

  const featuredBarbers = barbers.slice(0, 3);
  const hasVideo = Boolean(unit.hero_video_url);
  const heroImage = !hasVideo && unit.banner_url ? unit.banner_url : null;
  const hasMedia = hasVideo || Boolean(heroImage);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: unit.name, path: `/${unit.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TrackPageView unitId={unit.id} />

      {/* ───────────────────────────── HERO ──────────────────────────────── */}
      <section
        className={[
          "relative overflow-hidden px-4 pt-14 pb-20 sm:px-6 lg:px-12",
          hasMedia ? "min-h-[560px] sm:min-h-[640px] lg:min-h-[720px]" : "",
        ].join(" ")}
      >
        {/* ── Media background (video, or banner image as fallback) ── */}
        {hasVideo && (
          <video
            autoPlay
            muted
            loop
            playsInline
            src={unit.hero_video_url!}
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden="true"
          />
        )}
        {heroImage && (
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {hasMedia && (
          <>
            {/* Top-to-bottom: transparent at top → opaque background at bottom */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
            {/* Side vignette for depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />
            {/* Subtle top scrim so the eyebrow badge reads cleanly */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/60 to-transparent" />
          </>
        )}

        {/* ── Content ── */}
        <div className="relative mx-auto max-w-4xl">
          {/* Eyebrow badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-bg-surface/90 px-4 py-2 text-xs font-medium text-foreground/70 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.2)]" />
            {t.hero.openBadge}
          </div>

          {/* Hero title */}
          <h1 className="font-heading text-[56px] font-semibold leading-[0.98] tracking-tight sm:text-[68px] lg:text-[84px]">
            <span className="mb-3 block font-heading text-[22px] font-medium tracking-widest text-muted-foreground sm:text-[26px] lg:text-[30px]">
              {t.hero.leadingLine}
            </span>
            {t.hero.tagline1}
            <br />
            <em className="font-normal not-italic text-brand" style={{ fontStyle: "italic" }}>
              {t.hero.tagline2}
            </em>
          </h1>

          {/* Subtext */}
          <p className="mt-6 max-w-[540px] text-[17px] leading-relaxed text-muted-foreground">
            {t.header.unitLabel} <strong className="text-foreground">{unit.name}</strong>
            {unit.address && <> · {unit.address}.</>}{" "}
            {interpolate(t.hero.subtext, { years: yearsOpen })}
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            <BookingButton
              unit={unit}
              className="rounded-full px-7 py-3.5 text-[15px] font-medium"
            />
            <a
              href="#produtos"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-transparent px-7 py-3.5 text-[15px] font-medium text-foreground transition hover:bg-foreground hover:text-background active:scale-[0.96]"
            >
              <ShoppingBag className="h-4 w-4" />
              {t.hero.viewProducts}
            </a>
          </div>

          {/* Stats row */}
          {/* Só métricas verificáveis: "350 cortes/mês" e "4.9 ★ Google" eram
              literais inventados, sem fonte. `yearsOpen` é calculado a partir
              de 2012. */}
          <div className="mt-10 grid gap-4 border-t border-border pt-8 sm:w-max sm:gap-12">
            {[
              { num: `${yearsOpen}+`, label: t.stats.years },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-heading text-3xl font-semibold tracking-tight">
                  {s.num}
                </div>
                <div className="mt-0.5 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarqueeBand />

      <WhyUs />

      {/* ──────────────────────────── BARBERS ────────────────────────────── */}
      {featuredBarbers.length > 0 && (
        <section className="bg-bg-surface px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                {t.team.eyebrow}
              </p>
              <h2 className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {t.team.title}
              </h2>
              <p className="mt-4 text-[17px] text-muted-foreground">
                {t.team.subtitle}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredBarbers.map((b, i) => {
                const gradient = BARBER_GRADIENTS[i % BARBER_GRADIENTS.length];
                const initials = getInitials(b.name);

                return (
                  <article
                    key={b.id}
                    className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_24px_50px_-24px_rgba(26,20,16,0.2)] active:scale-[0.98]"
                  >
                    <div
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
                    </div>

                    <div className="p-6">
                      <div className="mb-3">
                        {b.speciality && (
                          <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                            {b.speciality}
                          </span>
                        )}
                      </div>
                      <h3 className="font-heading text-[26px] font-semibold tracking-tight">
                        {b.name}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {interpolate(t.team.specialistIn, { speciality: b.speciality ?? t.team.defaultSpeciality })}
                      </p>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <BookingButton
                          unit={unit}
                          barber={b}
                          className="rounded-full px-4 py-2 text-sm"
                        />
                        {b.socials?.instagram && (
                          <a
                            href={b.socials.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground transition hover:text-brand"
                          >
                            @{b.socials.instagram.split("/").pop()}
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {barbers.length > 3 && (
              <div className="mt-10 text-center">
                <Link
                  href={`/${unit.slug}/barbeiros`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  {t.team.viewAll}
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ──────────────────────────── PRODUCTS ───────────────────────────── */}
      {products.length > 0 && (
        <section id="produtos" className="scroll-mt-24 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                {t.shop.eyebrow}
              </p>
              <h2 className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {t.shop.title}
              </h2>
              <p className="mt-4 text-[17px] text-muted-foreground">
                {t.shop.subtitle}
              </p>
            </div>

            {/* Horizontal carousel */}
            <div className="-mx-4 flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-4 sm:-mx-6 sm:px-6">
              {products.map((p) => {
                const out = p.out_of_stock || p.stock === 0;
                const pct =
                  p.compare_at_price_cents != null &&
                  p.compare_at_price_cents > p.price_cents
                    ? Math.round(
                        ((p.compare_at_price_cents - p.price_cents) /
                          p.compare_at_price_cents) *
                          100,
                      )
                    : null;
                return (
                  <Link
                    key={p.id}
                    href={`/${unit.slug}/produtos/${p.slug}`}
                    className="group w-[200px] shrink-0 snap-start flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_24px_50px_-24px_rgba(26,20,16,0.2)] active:scale-[0.97] sm:w-[230px]"
                  >
                    <div className="relative aspect-square overflow-hidden bg-bg-surface">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          sizes="230px"
                          className={`object-cover transition duration-300 group-hover:scale-105 ${out ? "opacity-50 grayscale" : ""}`}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                      {pct != null && !out && (
                        <div className="absolute right-2 top-2 rounded-full bg-brand px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#1a1410]">
                          −{pct}%
                        </div>
                      )}
                      {out && (
                        <div className="absolute left-2 top-2 rounded-full bg-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-background">
                          {t.shop.soldOut}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-heading text-[15px] font-medium leading-tight tracking-tight line-clamp-2">
                        {p.name}
                      </h3>
                      <div className="mt-auto pt-3 flex flex-col gap-0.5">
                        {pct != null && (
                          <s className="text-xs text-muted-foreground">
                            {formatPrice(p.compare_at_price_cents!)}
                          </s>
                        )}
                        <span className="font-heading text-[20px] font-semibold tracking-tight">
                          {formatPriceOrAsk(p.price_cents)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
