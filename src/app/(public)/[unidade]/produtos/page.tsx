import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import {
  getCategoriesByUnit,
  getProductsByUnit,
  getUnitBySlug,
} from "@/lib/data";
import { buildUnitMetadata } from "@/lib/seo";
import { TrackPageView } from "@/components/public/track-page-view";
import { formatPrice } from "@/lib/utils";

type Params = { unidade: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { unidade } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) return {};
  return buildUnitMetadata(unit, {
    title: `Produtos — ${unit.name}`,
    description: `Os produtos que usamos e recomendamos em ${unit.name}. Encomenda via WhatsApp.`,
    path: `/${unit.slug}/produtos`,
  });
}

export default async function ProdutosPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { unidade } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) notFound();
  const [products, categories] = await Promise.all([
    getProductsByUnit(unit.id),
    getCategoriesByUnit(unit.id),
  ]);

  const grouped = categories.length
    ? categories.map((c) => ({
        category: c,
        items: products.filter((p) => p.category_id === c.id),
      }))
    : [{ category: null, items: products }];

  const orphans = categories.length
    ? products.filter((p) => !p.category_id)
    : [];

  return (
    <>
      <TrackPageView unitId={unit.id} />

      {/* ── Page header ── */}
      <section className="border-b border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
            Loja
          </p>
          <h1 className="font-heading text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Produtos profissionais.
          </h1>
          <p className="mt-4 max-w-xl text-[17px] text-muted-foreground">
            Os mesmos produtos que usamos no salão. Encomenda via WhatsApp e
            levanta na unidade ou recebe em casa.
          </p>
        </div>
      </section>

      {/* ── Products ── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {products.length === 0 ? (
            <div className="rounded-2xl border border-border bg-bg-surface p-16 text-center">
              <ShoppingBag className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
              <p className="text-lg text-muted-foreground">
                Em breve novos produtos disponíveis.
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {grouped.map(({ category, items }) =>
                items.length === 0 ? null : (
                  <div key={category?.id ?? "all"}>
                    {category && (
                      <div className="mb-8 flex items-center gap-4">
                        <h2 className="font-heading text-2xl font-semibold">
                          {category.name}
                        </h2>
                        <div className="flex-1 border-t border-border" />
                      </div>
                    )}
                    <ProductGrid unitSlug={unit.slug} items={items} />
                  </div>
                ),
              )}
              {orphans.length > 0 && (
                <div>
                  <div className="mb-8 flex items-center gap-4">
                    <h2 className="font-heading text-2xl font-semibold">Outros</h2>
                    <div className="flex-1 border-t border-border" />
                  </div>
                  <ProductGrid unitSlug={unit.slug} items={orphans} />
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ProductGrid({
  unitSlug,
  items,
}: {
  unitSlug: string;
  items: Awaited<ReturnType<typeof getProductsByUnit>>;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <Link
          key={p.id}
          href={`/${unitSlug}/produtos/${p.slug}`}
          className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_24px_50px_-24px_rgba(26,20,16,0.2)]"
        >
          {/* Image */}
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
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col p-5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {p.name.split(" ")[0].toUpperCase()}
            </p>
            <h3 className="font-heading text-[18px] font-medium leading-tight tracking-tight">
              {p.name}
            </h3>
            {p.description && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {p.description}
              </p>
            )}
            <div className="mt-auto flex items-center justify-between pt-4">
              <span className="font-heading text-[26px] font-semibold tracking-tight">
                {formatPrice(p.price_cents)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition group-hover:bg-brand group-hover:text-[#1a1410]">
                Ver →
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
