import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Scissors,
} from "lucide-react";
import { getAllUnits } from "@/lib/data";
import { buildOrganizationJsonLd, homeMetadata } from "@/lib/seo";
import { getServerI18n } from "@/lib/i18n/server";
import { formatPhonePT } from "@/lib/utils";
import { MarqueeBand } from "@/components/public/sections/marquee-band";
import { WhyUs } from "@/components/public/sections/why-us";
import { FooterBottomBar } from "@/components/public/footer";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/public/social-icons";

export const metadata = homeMetadata();

const yearsOpen = new Date().getFullYear() - 2012;

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export default async function HomePage() {
  const [units, { dict: t }] = await Promise.all([
    getAllUnits(),
    getServerI18n(),
  ]);

  const jsonLd = buildOrganizationJsonLd(units);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-[100dvh] bg-background text-foreground">
        {/* ─────────────────────────── HEADER ──────────────────────────── */}
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Barbearia Of Brothers"
              width={44}
              height={44}
              priority
              className="h-10 w-auto"
            />
            <div>
              <p className="font-heading text-base font-semibold leading-tight">
                Barbearia Of Brothers
              </p>
              <p className="text-xs uppercase tracking-[0.14em] text-brand">
                {t.home.tagline}
              </p>
            </div>
          </Link>
        </header>

        {/* ──────────────────── HERO + SELETOR DE UNIDADE ───────────────── */}
        {/* O seletor mantém-se no topo, onde o visitante já está habituado a
            encontrá-lo. A diferença face à versão anterior é que deixou de ser
            a página inteira: agora tem conteúdo por baixo. */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                <Scissors className="h-3.5 w-3.5" />
                Leiria
              </div>

              <h1 className="font-heading text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
                {t.homeLanding.h1}
              </h1>

              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                {t.homeLanding.intro}
              </p>

              <div className="mt-8 border-t border-border pt-6">
                <div className="font-heading text-3xl font-semibold tracking-tight">
                  {yearsOpen}+
                </div>
                <div className="mt-0.5 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  {t.stats.years}
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                {t.homeLanding.chooseUnit}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t.homeLanding.chooseUnitSubtitle}
              </p>

              {units.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-border bg-bg-surface p-6">
                  <h3 className="font-heading text-xl font-semibold">
                    {t.home.noUnitsTitle}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t.home.noUnitsDesc}
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-3">
                  {units.map((unit) => (
                    <Link
                      key={unit.id}
                      href={`/${unit.slug}`}
                      className="group rounded-2xl border border-border bg-bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:bg-card hover:shadow-premium sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate font-heading text-2xl font-semibold">
                            {unit.name}
                          </h3>
                          {unit.address && (
                            <div className="mt-3 flex gap-2 text-sm leading-relaxed text-muted-foreground">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                              <span>{unit.address}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background text-brand transition group-hover:bg-brand group-hover:text-primary-foreground">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <MarqueeBand />

        {/* ───────────────────────────  SERVIÇOS  ───────────────────────── */}
        {/* Renderiza a partir de `t.homeLanding.services`, a mesma lista que
            alimenta o `makesOffer` do JSON-LD em `src/lib/seo.ts`, para que o
            conteúdo visível e a marcação não possam divergir. */}
        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                {t.homeLanding.servicesEyebrow}
              </p>
              <h2 className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {t.homeLanding.servicesTitle}
              </h2>
              <p className="mt-4 text-[17px] text-muted-foreground">
                {t.homeLanding.servicesSubtitle}
              </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {t.homeLanding.services.map((name) => (
                <li
                  key={name}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-bg-surface px-5 py-4 transition hover:border-brand/30"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                    <Scissors className="h-4 w-4 text-brand" />
                  </span>
                  <span className="font-heading text-lg font-medium">{name}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <WhyUs />

        {/* ──────────────────────── AS NOSSAS UNIDADES ──────────────────── */}
        {units.length > 0 && (
          <section className="bg-bg-surface px-4 py-24 sm:px-6">
            <div className="mx-auto max-w-7xl">
              <div className="mx-auto mb-14 max-w-2xl text-center">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                  {t.homeLanding.unitsEyebrow}
                </p>
                <h2 className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  {t.homeLanding.unitsTitle}
                </h2>
                <p className="mt-4 text-[17px] text-muted-foreground">
                  {t.homeLanding.unitsSubtitle}
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className="rounded-2xl border border-border bg-background p-6 sm:p-8"
                  >
                    <h3 className="font-heading text-2xl font-semibold">
                      {unit.name}
                    </h3>

                    <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                      {unit.address && (
                        <li className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                          <span>
                            {unit.address}
                            {unit.maps_url && (
                              <>
                                {" · "}
                                <a
                                  href={unit.maps_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand underline underline-offset-2 hover:opacity-80"
                                >
                                  {t.contato.mapsLink}
                                </a>
                              </>
                            )}
                          </span>
                        </li>
                      )}
                      {unit.phone && (
                        <li className="flex items-center gap-3">
                          <Phone className="h-4 w-4 shrink-0 text-brand" />
                          <a
                            href={`tel:${unit.phone}`}
                            className="transition hover:text-brand"
                          >
                            {formatPhonePT(unit.phone)}
                          </a>
                        </li>
                      )}
                      {unit.whatsapp && (
                        <li className="flex items-center gap-3">
                          <MessageCircle className="h-4 w-4 shrink-0 text-brand" />
                          <a
                            href={`https://wa.me/${unit.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition hover:text-brand"
                          >
                            WhatsApp
                          </a>
                        </li>
                      )}
                    </ul>

                    {/* Horários lidos da base de dados. As strings fixas do
                        dicionário ("Seg — Sáb · 09:30 — 19:30") divergiam dos
                        horários reais das unidades. */}
                    {unit.hours && (
                      <div className="mt-6 border-t border-border pt-5">
                        <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
                          <Clock className="h-3.5 w-3.5 text-brand" />
                          {t.homeLanding.hoursTitle}
                        </p>
                        <dl className="grid gap-1 text-sm">
                          {DAY_KEYS.map((day) => {
                            const slot = unit.hours?.[day];
                            return (
                              <div key={day} className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">
                                  {t.contato.days[day]}
                                </dt>
                                <dd className="tabular-nums">
                                  {slot?.open && slot?.close
                                    ? `${slot.open} — ${slot.close}`
                                    : t.contato.closed}
                                </dd>
                              </div>
                            );
                          })}
                        </dl>
                      </div>
                    )}

                    {(unit.socials?.instagram ||
                      unit.socials?.facebook ||
                      unit.socials?.tiktok) && (
                      <div className="mt-6 flex gap-2">
                        {unit.socials?.instagram && (
                          <a
                            href={unit.socials.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Instagram — ${unit.name}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-surface text-muted-foreground transition hover:bg-brand hover:text-primary-foreground"
                          >
                            <InstagramIcon className="h-4 w-4" />
                          </a>
                        )}
                        {unit.socials?.facebook && (
                          <a
                            href={unit.socials.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Facebook — ${unit.name}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-surface text-muted-foreground transition hover:bg-brand hover:text-primary-foreground"
                          >
                            <FacebookIcon className="h-4 w-4" />
                          </a>
                        )}
                        {unit.socials?.tiktok && (
                          <a
                            href={unit.socials.tiktok}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`TikTok — ${unit.name}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-surface text-muted-foreground transition hover:bg-brand hover:text-primary-foreground"
                          >
                            <TikTokIcon className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Ligações internas para as subpáginas: só 3 URLs do
                        domínio estavam indexados, e a homepage não ligava para
                        subpágina nenhuma. */}
                    <div className="mt-7 flex flex-wrap gap-2">
                      <Link
                        href={`/${unit.slug}`}
                        className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-brand-hover"
                      >
                        {t.homeLanding.viewUnit}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/${unit.slug}/barbeiros`}
                        className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-foreground hover:text-background"
                      >
                        {t.homeLanding.viewTeam}
                      </Link>
                      <Link
                        href={`/${unit.slug}/contato`}
                        className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-foreground hover:text-background"
                      >
                        {t.homeLanding.viewContact}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* A homepage não tinha footer nenhum — e por isso `/privacidade` e
          `/termos` estavam sem ligações internas a partir do URL com mais
          autoridade do domínio. */}
      <footer className="bg-[#0b1115]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 sm:px-6">
          <Image
            src="/logo.png"
            alt="Barbearia Of Brothers"
            width={56}
            height={56}
            className="h-14 w-auto brightness-0 invert"
          />
          <p className="max-w-md text-[13px] leading-relaxed text-white/60">
            {t.footer.since}
          </p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
            {units.map((unit) => (
              <Link
                key={unit.id}
                href={`/${unit.slug}`}
                className="transition hover:text-brand"
              >
                {unit.name}
              </Link>
            ))}
          </nav>
        </div>
        <FooterBottomBar />
      </footer>
    </>
  );
}
