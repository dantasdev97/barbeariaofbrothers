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
    description: `Os produtos que usamos e recomendamos em ${unit.name}.`,
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
      <section className="container-page py-12 sm:py-16">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs uppercase tracking-[0.2em] text-brand">
            Loja
          </span>
          <h1 className="mt-2 font-heading text-4xl font-semibold sm:text-5xl">
            Produtos
          </h1>
          <p className="mt-3 text-muted-foreground">
            Encomende via WhatsApp e levante na barbearia.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-bg-surface p-10 text-center text-muted-foreground">
            Em breve novos produtos.
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.map(({ category, items }) =>
              items.length === 0 ? null : (
                <div key={category?.id ?? "all"}>
                  {category && (
                    <h2 className="mb-5 font-heading text-2xl font-semibold">
                      {category.name}
                    </h2>
                  )}
                  <ProductGrid unitSlug={unit.slug} items={items} />
                </div>
              ),
            )}
            {orphans.length > 0 && (
              <div>
                <h2 className="mb-5 font-heading text-2xl font-semibold">Outros</h2>
                <ProductGrid unitSlug={unit.slug} items={orphans} />
              </div>
            )}
          </div>
        )}
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
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((p) => (
        <Link
          key={p.id}
          href={`/${unitSlug}/produtos/${p.slug}`}
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
            {p.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {p.description}
              </p>
            )}
            <span className="mt-auto pt-2 text-lg font-bold text-brand">
              {formatPrice(p.price_cents)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
