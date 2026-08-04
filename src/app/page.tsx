import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Eye,
  Layers,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  Scissors,
  Sparkles,
  Wind,
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

/**
 * Um ícone por serviço, alinhado por posição com `t.homeLanding.services` —
 * mesmo padrão que `why-us.tsx` usa para as suas features. Antes era a mesma
 * tesoura seis vezes, o que se lê como erro e não como sistema.
 */
const SERVICE_ICONS = [Scissors, Sparkles, Layers, Eye, Wind, Palette];

export default async function HomePage() {
  const [units, { dict: t }] = await Promise.all([
    getAllUnits(),
    getServerI18n(),
  ]);

  const jsonLd = buildOrganizationJsonLd(units);

  // Redes agregadas das unidades, sem repetir a mesma conta duas vezes.
  const socials = [
    ...new Map(
      units
        .flatMap((u) => [
          { href: u.socials?.instagram, label: "Instagram", Icon: InstagramIcon },
          { href: u.socials?.facebook, label: "Facebook", Icon: FacebookIcon },
          { href: u.socials?.tiktok, label: "TikTok", Icon: TikTokIcon },
        ])
        .filter((s): s is { href: string; label: string; Icon: typeof InstagramIcon } =>
          Boolean(s.href),
        )
        .map((s) => [s.href, s] as const),
    ).values(),
  ];

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
                <div className="stagger mt-5 grid gap-3">
                  {units.map((unit, i) => (
                    <Link
                      key={unit.id}
                      href={`/${unit.slug}`}
                      style={{ "--stagger-index": i } as React.CSSProperties}
                      className="group rounded-2xl border border-border bg-bg-surface p-5 transition-[border-color,background-color,box-shadow,translate,scale] duration-200 ease-out-strong hover:-translate-y-0.5 hover:border-brand/40 hover:bg-card hover:shadow-premium active:scale-[0.99] sm:p-6"
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

            <ul className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {t.homeLanding.services.map((name, i) => {
                const Icon = SERVICE_ICONS[i] ?? Scissors;
                return (
                  <li
                    key={name}
                    style={{ "--stagger-index": i } as React.CSSProperties}
                    className="group/svc flex items-center gap-4 rounded-2xl border border-border bg-bg-surface px-5 py-4 transition-[border-color,box-shadow,translate] duration-200 ease-out-strong hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-premium"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors duration-200 group-hover/svc:bg-brand group-hover/svc:text-primary-foreground">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="font-heading text-lg font-medium">{name}</span>
                  </li>
                );
              })}
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

              <div className="stagger grid gap-6 lg:grid-cols-2">
                {units.map((unit, i) => (
                  <div
                    key={unit.id}
                    style={{ "--stagger-index": i } as React.CSSProperties}
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
                            className="transition-colors duration-150 hover:text-brand"
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
                            className="transition-colors duration-150 hover:text-brand"
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
                        className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-primary-foreground transition-[background-color,scale] duration-150 ease-out-strong hover:bg-brand-hover active:scale-[0.97]"
                      >
                        {t.homeLanding.viewUnit}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/${unit.slug}/barbeiros`}
                        className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-[background-color,border-color,color,scale] duration-150 ease-out-strong hover:bg-foreground hover:text-background active:scale-[0.97]"
                      >
                        {t.homeLanding.viewTeam}
                      </Link>
                      <Link
                        href={`/${unit.slug}/contato`}
                        className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-[background-color,border-color,color,scale] duration-150 ease-out-strong hover:bg-foreground hover:text-background active:scale-[0.97]"
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

      {/* Footer de marca: as páginas de unidade usam `<Footer unit={...} />`,
          que é obrigatoriamente de uma só unidade. A homepage não tem unidade,
          por isso lista as duas — e mantém a mesma linguagem visual. */}
      <footer className="bg-[#0b1115]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4">
          {/* Marca */}
          <div>
            <Image
              src="/logo.png"
              alt="Barbearia Of Brothers"
              width={56}
              height={56}
              className="h-14 w-auto brightness-0 invert"
            />
            <p className="mt-4 text-[13px] text-white/60">{t.footer.since}</p>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-white/60">
              {t.homeLanding.intro}
            </p>
          </div>

          {/* Unidades, com morada */}
          <div className="md:col-span-2">
            <h2 className="mb-3 font-heading text-[14px] font-semibold uppercase tracking-wider text-white">
              {t.homeLanding.unitsEyebrow.replace(/^\d+\s*—\s*/, "")}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {units.map((unit) => (
                <li key={unit.id}>
                  <Link
                    href={`/${unit.slug}`}
                    className="font-heading text-[15px] font-semibold text-white transition-colors duration-150 hover:text-brand"
                  >
                    {unit.name}
                  </Link>
                  {unit.address && (
                    <p className="mt-1.5 flex items-start gap-2 text-[13px] leading-relaxed text-white/60">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                      {unit.address}
                    </p>
                  )}
                  {unit.phone && (
                    <a
                      href={`tel:${unit.phone}`}
                      className="mt-1.5 flex items-center gap-2 text-[13px] text-white/60 transition-colors duration-150 hover:text-brand"
                    >
                      <Phone className="h-3.5 w-3.5 text-brand" />
                      {formatPhonePT(unit.phone)}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Navegação */}
          <div>
            <h2 className="mb-3 font-heading text-[14px] font-semibold uppercase tracking-wider text-white">
              {t.footer.navigate}
            </h2>
            <ul className="space-y-2 text-sm text-white/70">
              {units.map((unit) => (
                <li key={unit.id}>
                  <Link
                    href={`/${unit.slug}/barbeiros`}
                    className="transition-colors duration-150 hover:text-brand"
                  >
                    {t.homeLanding.viewTeam} — {unit.name}
                  </Link>
                </li>
              ))}
              {units.map((unit) => (
                <li key={`c-${unit.id}`}>
                  <Link
                    href={`/${unit.slug}/contato`}
                    className="transition-colors duration-150 hover:text-brand"
                  >
                    {t.homeLanding.viewContact} — {unit.name}
                  </Link>
                </li>
              ))}
            </ul>

            {socials.length > 0 && (
              <div className="mt-6 flex gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-[background-color,color,scale] duration-150 ease-out-strong hover:bg-brand hover:text-[#1a1410] active:scale-[0.97]"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <FooterBottomBar />
      </footer>
    </>
  );
}
