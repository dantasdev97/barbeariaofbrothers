import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, ShoppingBag } from "lucide-react";
import {
  getBarbersByUnit,
  getProductsByUnit,
  getUnitBySlug,
} from "@/lib/data";
import { BookingButton } from "@/components/public/booking-button";
import { TrackPageView } from "@/components/public/track-page-view";
import { formatPrice } from "@/lib/utils";

// ─── Static data (no DB table for services yet) ───────────────────────────────
const SERVICES = [
  { num: "01", name: "Corte Clássico", time: "30 min", price: "12€" },
  { num: "02", name: "Corte + Barba", time: "50 min", price: "18€" },
  { num: "03", name: "Barba Terapêutica", time: "25 min", price: "10€" },
  { num: "04", name: "Pai & Filho", time: "45 min", price: "20€" },
];

const MARQUEE_ITEMS = [
  "CORTE CLÁSSICO",
  "BARBA TERAPÊUTICA",
  "SOBRANCELHA",
  "DEGRADÊ",
  "NAVALHA",
  "PIGMENTAÇÃO",
];

// Barber card gradient backgrounds, assigned by index
const BARBER_GRADIENTS = [
  "linear-gradient(135deg, #1a1410, #2d2218)",
  "linear-gradient(135deg, #2d1a0a, #4a2e15)",
  "linear-gradient(135deg, #0a1f2d, #1a3d4f)",
  "linear-gradient(135deg, #1a2d0a, #2e4a15)",
  "linear-gradient(135deg, #0a142d, #15254a)",
  "linear-gradient(135deg, #2d0a1a, #4a1530)",
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
  const featuredProducts = products.slice(0, 4);

  return (
    <>
      <TrackPageView unitId={unit.id} />

      {/* ───────────────────────────── HERO ──────────────────────────────── */}
      <section className="px-4 pt-14 sm:px-6 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          {/* Left column */}
          <div>
            {/* Eyebrow badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.2)]" />
              Aberto hoje · 09:30 — 19:30
            </div>

            {/* Hero title */}
            <h1 className="font-heading text-5xl font-semibold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl xl:text-[84px]">
              Cortes que ficam.
              <br />
              <em className="font-normal not-italic text-brand" style={{ fontStyle: "italic" }}>
                Estilo que dura.
              </em>
            </h1>

            {/* Subtext */}
            <p className="mt-6 max-w-[480px] text-[17px] leading-relaxed text-muted-foreground">
              Unidade <strong className="text-foreground">{unit.name}</strong>
              {unit.address && (
                <>
                  {" "}
                  · {unit.address}.
                </>
              )}{" "}
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
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-[15px] font-medium text-foreground transition hover:bg-white/10"
              >
                <ShoppingBag className="h-4 w-4" />
                Ver produtos
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-10 grid w-max grid-cols-3 gap-12 border-t border-white/10 pt-8">
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

          {/* Right column — photo placeholders */}
          <div className="relative hidden aspect-square lg:grid lg:grid-cols-[1.4fr_1fr] lg:grid-rows-2 lg:gap-3">
            {/* Main large placeholder */}
            <div
              className="row-span-2 flex items-center justify-center overflow-hidden rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #2a221c, #4a3d34)",
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 14px, rgba(255,255,255,0.07) 14px 15px), linear-gradient(135deg, #2a221c, #4a3d34)",
              }}
            >
              <span className="rounded bg-white/10 px-2 py-1 font-mono text-[11px] uppercase tracking-widest text-white/60">
                FOTO · interior
              </span>
            </div>
            {/* Small placeholder A */}
            <div
              className="flex items-center justify-center overflow-hidden rounded-2xl"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 14px, rgba(255,255,255,0.05) 14px 15px)",
                background: "#1f2937",
              }}
            >
              <span className="rounded bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white/40">
                FOTO · corte
              </span>
            </div>
            {/* Small placeholder B */}
            <div
              className="flex items-center justify-center overflow-hidden rounded-2xl"
              style={{
                background: "#1a2530",
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 14px, rgba(255,255,255,0.04) 14px 15px)",
              }}
            >
              <span className="rounded bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white/40">
                FOTO · barba
              </span>
            </div>
            {/* "Desde 2012" badge */}
            <div
              className="absolute -right-4 -top-4 grid h-24 w-24 place-items-center rounded-full bg-brand text-center font-heading text-[12px] leading-tight text-primary-foreground"
              style={{ transform: "rotate(-12deg)" }}
            >
              Desde
              <br />
              <strong className="text-xl font-bold">2012</strong>
            </div>
          </div>
        </div>

        {/* ── Services marquee strip ── */}
        <div className="relative mt-20 overflow-hidden bg-[#0b1115] py-4 -mx-4 sm:-mx-6 lg:-mx-12">
          <div
            className="flex w-max gap-12"
            style={{ animation: "marquee 30s linear infinite" }}
          >
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <div key={i} className="flex items-center gap-12">
                <span className="font-heading text-[22px] font-medium tracking-wide text-white">
                  {item}
                </span>
                <span className="text-brand">●</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── SERVICES ───────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
            01 — Serviços
          </p>
          <h2 className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Preços simples, qualidade alta.
          </h2>
        </div>
        <div className="mx-auto max-w-3xl">
          {SERVICES.map((s, i) => (
            <div
              key={i}
              className="group grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 sm:gap-6 border-b border-white/8 py-6 text-lg transition-all hover:pl-3"
            >
              <span className="font-heading text-[13px] font-medium tracking-widest text-muted-foreground">
                {s.num}
              </span>
              <span className="font-heading font-medium tracking-tight group-hover:text-brand transition-colors">
                {s.name}
              </span>
              <div className="hidden h-px flex-1 border-b-2 border-dashed border-white/10 sm:block" />
              <span className="text-sm text-muted-foreground">{s.time}</span>
              <span className="font-heading text-2xl font-semibold tracking-tight">
                {s.price}
              </span>
            </div>
          ))}
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
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-background transition-all duration-300 hover:-translate-y-1 hover:border-brand/20 hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.5)]"
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
                      <div className="absolute right-4 top-4 rounded-full bg-background/90 px-3 py-1.5 text-[12px] font-medium tracking-wide">
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

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((p, i) => {
                const tag = getProductTag(i, p.name);
                return (
                  <Link
                    key={p.id}
                    href={`/${unit.slug}/produtos/${p.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-brand/20 hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.5)]"
                  >
                    {/* Product image / placeholder */}
                    <div className="relative aspect-square overflow-hidden bg-[#1f2937]">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          sizes="(min-width: 1024px) 25vw, 50vw"
                          className="object-contain p-6 transition duration-300 group-hover:scale-105 drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-white/10" />
                        </div>
                      )}
                      {tag && (
                        <div className="absolute left-4 top-4 rounded-full bg-background px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-foreground">
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-primary-foreground transition group-hover:bg-brand-hover">
                          Comprar →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {products.length > 4 && (
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

      {/* ───────────────────────────── ABOUT ─────────────────────────────── */}
      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
          {/* Text */}
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
              04 — A casa
            </p>
            <h2 className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Uma barbearia.{" "}
              <span className="text-muted-foreground">Dois irmãos. {yearsOpen} anos.</span>
            </h2>
            <p className="mt-6 text-[17px] leading-relaxed text-muted-foreground">
              Abrimos em 2012 com a ideia de fazer da barbearia um sítio onde se
              vem mais do que uma vez. Hoje somos duas unidades em Leiria — com a
              mesma equipa, os mesmos produtos e o mesmo cuidado.
            </p>
            <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
              Estás na unidade{" "}
              <strong className="text-foreground">{unit.name}</strong>, com{" "}
              {barbers.length > 0 ? `${barbers.length} barbeiros` : "a nossa equipa"} e horário
              das 09:30 às 19:30, segunda a sábado.
            </p>
            <ul className="mt-8 grid gap-2.5 text-sm">
              {[
                "Profissionais certificados",
                "Produtos importados (Turquia · Itália)",
                "Estacionamento gratuito",
                "Wi-fi e bebidas",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="text-brand">●</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Photo placeholders */}
          <div className="hidden aspect-square grid-cols-2 gap-4 lg:grid">
            <div
              className="row-span-2 flex items-center justify-center rounded-2xl"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 14px, rgba(255,255,255,0.04) 14px 15px)",
                background: "#1f2937",
              }}
            >
              <span className="rounded bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white/30">
                FOTO · vitrine
              </span>
            </div>
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 14px, rgba(255,255,255,0.04) 14px 15px)",
                background: "#1a2530",
              }}
            >
              <span className="rounded bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white/30">
                FOTO · cadeira
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
