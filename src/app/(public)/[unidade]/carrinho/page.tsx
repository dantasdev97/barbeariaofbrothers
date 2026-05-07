import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUnitBySlug } from "@/lib/data";
import { CartView } from "@/components/public/cart-view";

type Params = { unidade: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { unidade } = await params;
  return {
    title: `Carrinho — ${unidade}`,
    robots: { index: false, follow: false },
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
