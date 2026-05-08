import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllUnits, getUnitBySlug } from "@/lib/data";
import { buildLocalBusinessJsonLd, buildUnitMetadata } from "@/lib/seo";
import { Header } from "@/components/public/header";
import { Footer } from "@/components/public/footer";
import { FloatingCTA } from "@/components/public/floating-cta";

type Params = { unidade: string };

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { unidade } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) return { title: "Unidade não encontrada" };
  return buildUnitMetadata(unit);
}

export default async function UnitLayout({
  params,
  children,
}: {
  params: Promise<Params>;
  children: React.ReactNode;
}) {
  const { unidade } = await params;
  const [unit, units] = await Promise.all([getUnitBySlug(unidade), getAllUnits()]);
  if (!unit) notFound();

  const jsonLd = buildLocalBusinessJsonLd(unit);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header unit={unit} units={units} />
      <main className="flex-1">{children}</main>
      <Footer unit={unit} />
      <FloatingCTA unit={unit} />
    </>
  );
}
