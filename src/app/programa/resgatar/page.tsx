import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getProgramaContext } from "@/lib/loyalty/programa";
import { ClientShell } from "@/components/cliente/client-shell";
import { RewardsList } from "@/components/cliente/rewards-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Formas de resgatar · Pontos Of Brothers",
  description:
    "Cortes, descontos e brindes que pode trocar pelos seus pontos na Barbearia Of Brothers.",
};

export default async function ResgatarPage({
  searchParams,
}: {
  searchParams: Promise<{ unidade?: string }>;
}) {
  const { unidade } = await searchParams;
  const { unit, units, hasCard, rewards } = await getProgramaContext(unidade);

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
          Formas de resgatar
        </h1>

        {/* Sem `balance`: é vitrina. Resgatar é no cartão, com sessão. */}
        <RewardsList rewards={rewards} className="mt-6" />

        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
          Troca os pontos quando quiser, a partir do seu cartão. Recebe um
          código por email e é só mostrá-lo na barbearia.
        </p>

        {!hasCard && (
          <Link
            href={`/programa${q}`}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-foreground px-6 text-[15px] font-semibold text-background transition-[opacity,transform] duration-150 ease-out-strong hover-fine:hover:opacity-90 active:scale-[0.98]"
          >
            Criar conta grátis
          </Link>
        )}
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
