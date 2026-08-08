import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUnitBySlug } from "@/lib/data";
import { notFoundMetadata } from "@/lib/seo";
import { CartView } from "@/components/public/cart-view";

type Params = { unidade: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { unidade } = await params;
  const unit = await getUnitBySlug(unidade);
  // Nunca interpolar o parâmetro cru do URL no título: numa rota inexistente
  // isso punha texto arbitrário do URL dentro da <title> da resposta 404.
  if (!unit) return notFoundMetadata("Unidade não encontrada");
  return {
    title: `Carrinho — ${unit.name}`,
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  };
}

export default async function CarrinhoPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { unidade } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) notFound();
  return <CartView unit={unit} />;
}
