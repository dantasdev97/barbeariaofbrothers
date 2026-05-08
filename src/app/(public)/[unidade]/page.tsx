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
import { formatPrice } from "@/lib/utils";

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

function getProductTag(index: number, name: string): string | null {
  const low = name.toLowerCase();
  if (low.includes("voucher") || low.includes("vale") || low.includes("gift"))
    return "GIFT";
  if (index === 0) return "BESTSELLER";
  if (index === 1) return "NOVIDADE";
  return null;
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

  const [barbers, products] = await Promise.all([
    getBarbersByUnit(unit.id),
    getProductsByUnit(unit.id),
  ]);

  const featuredBarbers = barbers.slice(0, 3);
  const featuredProducts = products.slice(0, 3);

  return (
    <>
      <TrackPageView unitId={unit.id} />

      {/* ───────────────────────────── HERO ──────────────────────────────── */}
      <section className="px-4 pt-14 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-4xl">
          {/* Eyebrow badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-bg-surface px-4 py-2 text-xs font-medium text-foreground/70">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.2)]" />
            Aberto hoje · 09:30 — 19:30
          </div>

          {/* Hero title */}
          <h1 className="font-heading text-[56px] font-semibold leading-[0.98] tracking-tight sm:text-[68px] lg:text-[84px]">
            Cortes que ficam.
            <br />
            <em className="font-normal not-italic text-brand" style={{ fontStyle: "italic" }}>
              Estilo que dura.
            </em>
          </h1>

          {/* Subtext */}
          <p className="mt-6 max-w-[540px] text-[17px] leading-relaxed text-muted-foreground">
            Unidade <strong className="text-foreground">{unit.name}</strong>
            {unit.address && <> · {unit.address}.</>}{" "}
            {yearsOpen}+ anos de experiência, equipa premiada e produtos
            profissionais.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            <BookingButton
              unit={unit}
              className="rounded-full px-7 py-3.5 text-[15px] font-medium"
            />
            <Link
              href={`/${unit.slug}/produtos`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-transparent px-7 py-3.5 text-[15px] font-medium text-foreground transition hover:bg-foreground hover:text-background"
            >
              <ShoppingBag className="h-4 w-4" />
              Ver produtos
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-10 grid w-max grid-cols-3 gap-12 border-t border-border pt-8">
            {[
              { num: `${yearsOpen}+`, label: "anos abertos" },
              { num: "350", label: "cortes / mês" },
              { num: "4.9", label: "★ Google" },
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

      {/* ──────────────────────────── BARBERS ────────────────────────────── */}
      {featuredBarbers.length > 0 && (
        <section className="bg-bg-surface px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                02 — A equipa
              </p>
              <h2 className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Os barbeiros desta unidade.
              </h2>
              <p className="mt-4 text-[17px] text-muted-foreground">
                Escolhe um profissional e agenda diretamente. Cada barbeiro tem
                o seu estilo e a sua agenda.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredBarbers.map((b, i) => {
                const gradient = BARBER_GRADIENTS[i % BARBER_GRADIENTS.length];
                const initials = getInitials(b.name);
                const firstName = b.name.split(" ")[0];

                return (
                  <article
                    key={b.id}
                    className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_24px_50px_-24px_rgba(26,20,16,0.2)]"
                  >
                    {/* Photo placeholder with initials */}
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
                      {/* Years badge */}
                      <div className="absolute right-4 top-4 rounded-full bg-card px-3 py-1.5 text-[12px] font-medium tracking-wide text-foreground">
                        {i < 3 ? [12, 8, 5][i] : 4} anos
                      </div>
                    </div>

                    {/* Card body */}
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
                        Especialista em {b.speciality ?? "corte e barba"} com
                        anos de experiência na unidade.
                      </p>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <BookingButton
                          unit={unit}
                          barber={b}
                          label={`Agendar com ${firstName}`}
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
                  Ver todos os barbeiros →
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ──────────────────────────── PRODUCTS ───────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                03 — Loja
              </p>
              <h2 className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Produtos profissionais à venda.
              </h2>
              <p className="mt-4 text-[17px] text-muted-foreground">
                Os mesmos produtos que usamos no salão. Encomenda via WhatsApp e
                levanta na unidade ou recebe em casa.
              </p>
            </div>

            {/* 3-col grid matching the model */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((p, i) => {
                const tag = getProductTag(i, p.name);
                return (
                  <Link
                    key={p.id}
                    href={`/${unit.slug}/produtos/${p.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_24px_50px_-24px_rgba(26,20,16,0.2)]"
                  >
                    {/* Product image */}
                    <div className="relative aspect-square overflow-hidden bg-bg-surface">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          sizes="(min-width: 1024px) 33vw, 50vw"
                          className="object-contain p-8 transition duration-300 group-hover:scale-105 drop-shadow-[0_12px_24px_rgba(0,0,0,0.15)]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      {tag && (
                        <div className="absolute left-4 top-4 rounded-full bg-foreground px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-background">
                          {tag}
                        </div>
                      )}
                    </div>

                    {/* Product body */}
                    <div className="flex flex-1 flex-col p-5">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {p.name.split(" ")[0].toUpperCase()}
                      </p>
                      <h3 className="font-heading text-[19px] font-medium leading-tight tracking-tight">
                        {p.name}
                      </h3>
                      <div className="mt-auto flex items-center justify-between pt-4">
                        <span className="font-heading text-[28px] font-semibold tracking-tight">
                          {formatPrice(p.price_cents)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition group-hover:bg-brand group-hover:text-[#1a1410]">
                          Comprar →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {products.length > 3 && (
              <div className="mt-10 text-center">
                <Link
                  href={`/${unit.slug}/produtos`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Ver todos os produtos →
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

    </>
  );
}
