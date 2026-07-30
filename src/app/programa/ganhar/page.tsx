import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getProgramaContext } from "@/lib/loyalty/programa";
import { ClientShell } from "@/components/cliente/client-shell";
import { EarnList } from "@/components/cliente/earn-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Formas de ganhar · Pontos Of Brothers",
  description: "Todas as formas de juntar pontos na Barbearia Of Brothers.",
};

export default async function GanharPage({
  searchParams,
}: {
  searchParams: Promise<{ unidade?: string }>;
}) {
  const { unidade } = await searchParams;
  const { unit, units, hasCard, services, bonuses } =
    await getProgramaContext(unidade);

  const q = unit?.slug ? `?unidade=${unit.slug}` : "";

  const content = (
    <div className="flex-1 bg-background">
      <div className="mx-auto max-w-xl px-6 py-10">
        <Link
          href={`/programa${q}`}
          className="-ml-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm text-muted-foreground transition-colors duration-150 hover-fine:hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Pontos
        </Link>

        <h1 className="mt-6 font-heading text-[28px] font-semibold tracking-tight sm:text-[32px]">
          Formas de ganhar
        </h1>

        <EarnList services={services} bonuses={bonuses} className="mt-6" />

        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
          Os pontos de cada serviço entram na sua conta no fim do
          atendimento.
        </p>
      </div>
    </div>
  );

  if (!unit) return <main className="flex-1">{content}</main>;

  return (
    <ClientShell unit={unit} units={units} hasCard={hasCard}>
      {content}
    </ClientShell>
  );
}
