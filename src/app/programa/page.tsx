import Link from "next/link";
import type { Metadata } from "next";
import { Gift, HandCoins, Sparkles } from "lucide-react";
import { getProgramaContext } from "@/lib/loyalty/programa";
import { ClientShell } from "@/components/cliente/client-shell";
import { GoogleSignInButton } from "@/components/cliente/google-signin-button";
import { NavRow } from "@/components/cliente/nav-row";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Programa de Pontos · Barbearia Of Brothers",
  description:
    "Ganhe pontos em cada corte e troque por cortes, descontos e brindes da Barbearia Of Brothers.",
};

/**
 * Página de entrada do programa de fidelidade.
 *
 * Fica aberta a quem ainda não tem conta de propósito: mostrar primeiro o
 * que se ganha e só depois pedir o registo é o que faz a pessoa criar conta.
 *
 * As duas listas vivem em páginas próprias (`/programa/ganhar` e
 * `/programa/resgatar`), no molde da referência que o dono mandou: aqui
 * ficam só as duas linhas de navegação.
 */
export default async function ProgramaPage({
  searchParams,
}: {
  searchParams: Promise<{ unidade?: string }>;
}) {
  const { unidade } = await searchParams;
  const { unit, units, hasCard } = await getProgramaContext(unidade);

  const slug = unit?.slug;
  const q = slug ? `?unidade=${slug}` : "";

  const content = (
    <div className="flex-1 bg-background">
      {/* Hero */}
      <section className="bg-foreground px-6 pb-16 pt-14 text-background">
        <div className="mx-auto max-w-xl page-enter">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
            <Sparkles className="h-3 w-3" />
            Cartão Fidelidade
          </p>
          <h1 className="mt-4 font-heading text-[34px] font-semibold leading-[1.08] tracking-tight sm:text-[42px]">
            Cada corte conta pontos
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-background/70">
            Junte pontos em cada visita e troque por cortes, descontos e
            brindes da casa. Sem cartão de papel para perder.
          </p>

          <div className="mt-8">
            {hasCard ? (
              <Link
                href="/minha-conta"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-6 text-[15px] font-semibold text-[#0e0a07] transition-[opacity,transform] duration-150 ease-out-strong hover-fine:hover:opacity-90 active:scale-[0.98]"
              >
                Ver o meu cartão
              </Link>
            ) : (
              <>
                <GoogleSignInButton
                  next={`/minha-conta${q}`}
                  unitSlug={slug}
                  label="Criar conta grátis"
                  className="border-transparent bg-brand text-[#0e0a07] hover-fine:hover:opacity-90"
                />
                <p className="mt-3 text-center text-[13px] text-background/60">
                  Já tem conta?{" "}
                  <Link
                    href={`/entrar${q}`}
                    className="font-semibold text-brand underline underline-offset-2"
                  >
                    Iniciar sessão
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-xl space-y-10 px-6 py-12">
        {/* Pontos — as duas metades do programa, cada uma na sua página */}
        <section>
          <div className="rounded-2xl border border-border bg-bg-surface px-5 pb-1 pt-6 text-center">
            <h2 className="font-heading text-[22px] font-semibold tracking-tight">
              Pontos
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-muted-foreground">
              Junte pontos por várias acções e troque-os por recompensas da
              casa.
            </p>

            <div className="stagger mt-6 -mx-5 border-t border-border text-left">
              <NavRow
                index={0}
                href={`/programa/ganhar${q}`}
                icon={<HandCoins className="h-5 w-5" />}
                title="Formas de ganhar"
              />
              <NavRow
                index={1}
                href={`/programa/resgatar${q}`}
                icon={<Gift className="h-5 w-5" />}
                title="Formas de resgatar"
              />
            </div>
          </div>
        </section>

        {/* Fecho para quem ainda não tem cartão. A pessoa acabou de ver o
         * que o programa dá — é aqui que decide. */}
        {!hasCard && (
          <section className="rounded-2xl bg-foreground p-7 text-center text-background">
            <h2 className="font-heading text-[22px] font-semibold leading-tight tracking-tight">
              Comece a ganhar hoje
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-background/70">
              Criar conta é grátis e leva um toque. Os pontos começam a contar
              no próximo corte.
            </p>
            <div className="mt-6">
              <GoogleSignInButton
                next={`/minha-conta${q}`}
                unitSlug={slug}
                label="Criar conta grátis"
                className="border-transparent bg-brand text-[#0e0a07] hover-fine:hover:opacity-90"
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );

  // Sem unidade não há cabeçalho nem rodapé para montar (ambos são por
  // unidade). Só acontece com a base vazia; a página continua a abrir.
  if (!unit) return <main className="flex-1">{content}</main>;

  return (
    <ClientShell unit={unit} units={units} hasCard={hasCard}>
      {content}
    </ClientShell>
  );
}
