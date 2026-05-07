import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { getProductBySlug, getProductsByUnit, getUnitBySlug } from "@/lib/data";
import { buildUnitMetadata } from "@/lib/seo";
import { TrackPageView } from "@/components/public/track-page-view";
import { ProductActions } from "@/components/public/product-actions";
import { formatPrice } from "@/lib/utils";

type Params = { unidade: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { unidade, slug } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) return {};
  const p = await getProductBySlug(unit.id, slug);
  if (!p) return {};
  return buildUnitMetadata(unit, {
    title: p.seo_title ?? `${p.name} — ${unit.name}`,
    description: p.seo_description ?? p.description ?? p.name,
    path: `/${unit.slug}/produtos/${p.slug}`,
    ogImage: p.image_url ?? undefined,
  });
}

export default async function ProductDetail({
  params,
}: {
  params: Promise<Params>;
}) {
  const { unidade, slug } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) notFound();
  const p = await getProductBySlug(unit.id, slug);
  if (!p) notFound();

  const allProducts = await getProductsByUnit(unit.id);
  const related = allProducts
    .filter((x) => x.id !== p.id && x.category_id === p.category_id)
    .slice(0, 4);

  return (
    <>
      <TrackPageView unitId={unit.id} type="product_view" refId={p.id} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href={`/${unit.slug}/produtos`}
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos produtos
        </Link>

        <article className="grid gap-12 lg:grid-cols-2 lg:items-start">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-bg-surface">
            {p.image_url ? (
              <Image
                src={p.image_url}
                alt={p.name}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain p-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ShoppingBag className="h-24 w-24 text-white/10" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pt-2">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {p.name.split(" ")[0]}
            </p>
            <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              {p.name}
            </h1>
            <p className="mt-4 font-heading text-4xl font-semibold tracking-tight text-brand">
              {formatPrice(p.price_cents)}
            </p>

            {p.description && (
              <p className="mt-6 text-[17px] leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            )}

            <ProductActions
              unit={unit}
              product={{
                id: p.id,
                name: p.name,
                slug: p.slug,
                price_cents: p.price_cents,
                image_url: p.image_url,
              }}
              className="mt-8"
            />

            <div className="mt-6 rounded-xl border border-border bg-bg-surface p-4">
              <p className="text-sm text-muted-foreground">
                ✂ Encomendas confirmadas via WhatsApp. Levantamento na barbearia
                ou envio para casa.
              </p>
            </div>
          </div>
        </article>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-20">
            <div className="mb-8 flex items-center gap-4">
              <h2 className="font-heading text-2xl font-semibold">
                Outros produtos
              </h2>
              <div className="flex-1 border-t border-white/8" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/${unit.slug}/produtos/${rp.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_24px_50px_-24px_rgba(26,20,16,0.2)]"
                >
                  <div className="relative aspect-square overflow-hidden bg-bg-surface">
                    {rp.image_url ? (
                      <Image
                        src={rp.image_url}
                        alt={rp.name}
                        fill
                        sizes="25vw"
                        className="object-contain p-5 transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="h-10 w-10 text-white/10" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-heading text-base font-medium leading-tight">
                      {rp.name}
                    </h3>
                    <span className="mt-auto pt-2 font-heading text-lg font-semibold text-brand">
                      {formatPrice(rp.price_cents)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
