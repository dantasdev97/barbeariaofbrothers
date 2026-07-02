import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { getProductBySlug, getProductsByUnit, getUnitBySlug } from "@/lib/data";
import { buildBreadcrumbJsonLd, buildUnitMetadata, buildUnitPageTitle } from "@/lib/seo";
import { TrackPageView } from "@/components/public/track-page-view";
import { ProductActions } from "@/components/public/product-actions";
import { formatPrice, formatPriceOrAsk, absoluteUrl } from "@/lib/utils";
import { WhatsAppIcon, FacebookIcon, PinterestIcon } from "@/components/public/social-icons";

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
    title: p.seo_title ?? buildUnitPageTitle(p.name, unit),
    description:
      p.seo_description ??
      p.description ??
      `${p.name} — à venda na Barbearia Of Brothers em Leiria.`,
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

  const productUrl = absoluteUrl(`/${unit.slug}/produtos/${p.slug}`);
  const shareText = encodeURIComponent(`${p.name} — Barbearia Of Brothers\n${productUrl}`);
  const whatsappUrl = `https://wa.me/?text=${shareText}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
  const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(productUrl)}${p.image_url ? `&media=${encodeURIComponent(p.image_url)}` : ""}&description=${encodeURIComponent(p.name)}`;

  const allProducts = await getProductsByUnit(unit.id);
  const related = allProducts
    .filter((x) => x.id !== p.id && x.category_id === p.category_id)
    .slice(0, 4);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: unit.name, path: `/${unit.slug}` },
    { name: p.name, path: `/${unit.slug}/produtos/${p.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TrackPageView unitId={unit.id} type="product_view" refId={p.id} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href={`/${unit.slug}#produtos`}
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-brand active:scale-[0.96]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos produtos
        </Link>

        <article className="grid gap-12 lg:grid-cols-2 lg:items-start">
          {/* Image */}
          <div className="group relative aspect-square overflow-hidden rounded-3xl bg-bg-surface shadow-premium-lg">
            {p.image_url ? (
              <Image
                src={p.image_url}
                alt={p.name}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ShoppingBag className="h-24 w-24 text-muted-foreground/20" />
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
            <div className="mt-4 flex items-baseline gap-3">
              {p.compare_at_price_cents != null && p.compare_at_price_cents > p.price_cents && (
                <s className="text-2xl text-muted-foreground">{formatPrice(p.compare_at_price_cents)}</s>
              )}
              <p className="font-heading text-4xl font-semibold tracking-tight text-brand">
                {formatPriceOrAsk(p.price_cents)}
              </p>
              {(p.out_of_stock || p.stock === 0) && (
                <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold uppercase tracking-widest text-background">
                  Esgotado
                </span>
              )}
            </div>

            {p.description && (
              <p className="mt-6 text-[17px] leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            )}

            <ProductActions
              unit={unit}
              outOfStock={p.out_of_stock || p.stock === 0}
              product={{
                id: p.id,
                name: p.name,
                slug: p.slug,
                price_cents: p.price_cents,
                image_url: p.image_url,
              }}
              className="mt-8"
            />

            {/* Share */}
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Partilhar:</span>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Partilhar no WhatsApp"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-surface text-muted-foreground transition hover:border-[#25D366] hover:bg-[#25D366] hover:text-white active:scale-[0.96]"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Partilhar no Facebook"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-surface text-muted-foreground transition hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white active:scale-[0.96]"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a
                href={pinterestUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Partilhar no Pinterest"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-surface text-muted-foreground transition hover:border-[#E60023] hover:bg-[#E60023] hover:text-white active:scale-[0.96]"
              >
                <PinterestIcon className="h-4 w-4" />
              </a>
            </div>

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
            <div className="-mx-4 flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-4 sm:-mx-6 sm:px-6">
              {related.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/${unit.slug}/produtos/${rp.slug}`}
                  className="group w-[180px] shrink-0 snap-start flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_24px_50px_-24px_rgba(26,20,16,0.2)] active:scale-[0.97] sm:w-[220px]"
                >
                  <div className="relative aspect-square overflow-hidden bg-bg-surface">
                    {rp.image_url ? (
                      <Image
                        src={rp.image_url}
                        alt={rp.name}
                        fill
                        sizes="25vw"
                        className="object-cover transition group-hover:scale-105"
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
                      {formatPriceOrAsk(rp.price_cents)}
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
