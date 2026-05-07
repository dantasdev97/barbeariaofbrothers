import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Scissors, ShoppingBag, Sparkles } from "lucide-react";
import {
  getBarbersByUnit,
  getProductsByUnit,
  getUnitBySlug,
} from "@/lib/data";
import { Button } from "@/components/ui/button";
import { BookingButton } from "@/components/public/booking-button";
import { TrackPageView } from "@/components/public/track-page-view";
import { formatPrice } from "@/lib/utils";

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

      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="bg-grid absolute inset-0 -z-10 opacity-30" />
        <div className="absolute -top-32 right-1/4 -z-10 h-72 w-[28rem] rounded-full bg-brand/20 blur-3xl" />

        <div className="container-page grid gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-brand" />
              Since 2012
            </span>
            <h1 className="font-heading text-4xl font-semibold leading-[1.05] sm:text-5xl md:text-6xl">
              {unit.name.split("—")[0].trim()}
              <br />
              <span className="text-gradient-brand">corte. barba. estilo.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground">
              Bem-vindo à <strong className="text-foreground">{unit.name}</strong>.
              Marque online em segundos ou descubra os produtos que usamos no dia a dia.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <BookingButton unit={unit} className="px-6 py-6 text-base" />
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/15 bg-white/5 text-foreground hover:bg-white/10"
              >
                <Link href={`/${unit.slug}/produtos`}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Ver produtos
                </Link>
              </Button>
            </div>

            {unit.address && (
              <p className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-brand" />
                {unit.address}
              </p>
            )}
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand/30 via-transparent to-transparent blur-2xl" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-bg-surface shadow-premium-lg">
              <Image
                src={unit.banner_url ?? "/logo.png"}
                alt={unit.name}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className={
                  unit.banner_url ? "object-cover" : "object-contain p-12"
                }
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED BARBERS */}
      {featuredBarbers.length > 0 && (
        <section className="container-page py-16">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-brand">
                A nossa equipa
              </span>
              <h2 className="mt-2 font-heading text-3xl font-semibold sm:text-4xl">
                Barbeiros de confiança
              </h2>
            </div>
            <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Link href={`/${unit.slug}/barbeiros`}>Ver todos →</Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredBarbers.map((b) => (
              <Link
                key={b.id}
                href={`/${unit.slug}/barbeiros/${b.slug}`}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-bg-surface transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-premium-lg"
              >
                <div className="relative aspect-[4/5]">
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
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg-surface to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="font-heading text-xl font-semibold">{b.name}</h3>
                    {b.speciality && (
                      <p className="text-sm text-muted-foreground">{b.speciality}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="container-page py-16">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-brand">
                Loja
              </span>
              <h2 className="mt-2 font-heading text-3xl font-semibold sm:text-4xl">
                Produtos em destaque
              </h2>
            </div>
            <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Link href={`/${unit.slug}/produtos`}>Ver todos →</Link>
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((p) => (
              <Link
                key={p.id}
                href={`/${unit.slug}/produtos/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-surface transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-premium"
              >
                <div className="relative aspect-square bg-gradient-to-br from-bg-surface to-background">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ShoppingBag className="h-10 w-10 text-brand" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <h3 className="font-heading text-base font-semibold">{p.name}</h3>
                  <span className="mt-auto text-lg font-bold text-brand">
                    {formatPrice(p.price_cents)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA AGENDAR */}
      <section className="container-page py-16">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-bg-surface p-10 text-center shadow-premium md:p-16">
          <div className="absolute -top-20 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
          <Calendar className="mx-auto mb-4 h-10 w-10 text-brand" />
          <h2 className="font-heading text-3xl font-semibold sm:text-4xl">
            Pronto para o próximo corte?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Agende em segundos no nosso sistema online — escolha o barbeiro, o serviço
            e o melhor horário.
          </p>
          <div className="mt-8 flex justify-center">
            <BookingButton unit={unit} className="px-8 py-6 text-base" />
          </div>
        </div>
      </section>
    </>
  );
}
