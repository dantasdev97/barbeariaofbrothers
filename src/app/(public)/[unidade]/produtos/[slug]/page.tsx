import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { getProductBySlug, getUnitBySlug } from "@/lib/data";
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

  return (
    <>
      <TrackPageView unitId={unit.id} type="product_view" refId={p.id} />
      <article className="container-page py-12">
        <Link
          href={`/${unit.slug}/produtos`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos produtos
        </Link>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-bg-surface shadow-premium-lg">
            {p.image_url ? (
              <Image
                src={p.image_url}
                alt={p.name}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ShoppingBag className="h-20 w-20 text-brand" />
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="font-heading text-4xl font-semibold sm:text-5xl">
              {p.name}
            </h1>
            <p className="mt-4 text-3xl font-bold text-brand">
              {formatPrice(p.price_cents)}
            </p>
            {p.description && (
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
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

            <p className="mt-6 text-xs text-muted-foreground">
              💡 Encomendas confirmadas via WhatsApp. Levantamento na barbearia.
            </p>
          </div>
        </div>
      </article>
    </>
  );
}
