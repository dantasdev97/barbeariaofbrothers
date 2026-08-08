import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAllUnits, getLoyaltyUnits, getUnitBySlug } from "@/lib/data";
import { ClientShell } from "@/components/cliente/client-shell";
import { EmailAuthForm } from "@/components/cliente/email-auth-form";
import { GoogleSignInButton } from "@/components/cliente/google-signin-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar · Cartão Fidelidade",
  description: "Aceda ao seu cartão de fidelidade da Barbearia Of Brothers.",
  robots: { index: false, follow: false },
};

/**
 * Entrada do cliente — distinta do `/login`, que é do staff.
 *
 * Mantê-las separadas evita a confusão de um cliente aterrar num ecrã que
 * pede palavra-passe de painel, e deixa cada uma falar a linguagem do seu
 * público.
 */
export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string; unidade?: string }>;
}) {
  const { next, erro, unidade } = await searchParams;

  // Quem chega aqui a partir de uma unidade traz o slug. Quem chega sem ele
  // — de um bookmark, do `/minha-conta` deslogado, do "voltar a entrar" do
  // `/redefinir` — não trazia nada, e acabava no ecrã a escolher a barbearia
  // depois de já ter criado conta. Quando só uma unidade participa no
  // programa, essa pergunta não tem outra resposta possível: resolve-se aqui,
  // como o `/programa` já fazia, e o slug segue no `next` e no cookie que o
  // botão da Google grava antes de sair do site.
  const loyaltyUnits = await getLoyaltyUnits();
  const resolvedSlug =
    unidade ?? (loyaltyUnits.length === 1 ? loyaltyUnits[0].slug : undefined);

  const fallbackNext = resolvedSlug
    ? `/minha-conta?unidade=${resolvedSlug}`
    : "/minha-conta";
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : fallbackNext;

  // Já autenticado: não faz sentido mostrar o ecrã de entrada.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(safeNext);

  const [unit, units] = await Promise.all([
    unidade ? getUnitBySlug(unidade) : Promise.resolve(null),
    // Todas as unidades: aqui `units` só alimenta o seletor do cabeçalho,
    // que tem de continuar a mostrar o site inteiro.
    getAllUnits(),
  ]);
  const shellUnit = unit ?? units[0] ?? null;

  const content = (
    <div className="flex min-h-[60vh] flex-1 flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <Link
          href={unidade ? `/programa?unidade=${unidade}` : "/programa"}
          className="mb-8 -ml-2 inline-flex min-h-11 items-center self-start rounded-lg px-2 text-sm text-muted-foreground transition-colors duration-150 hover-fine:hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Programa de pontos
        </Link>

        <div className="page-enter">
          <Image
            src="/logo.png"
            alt=""
            width={56}
            height={56}
            className="mb-6"
          />
          <h1 className="font-heading text-[30px] font-semibold leading-tight tracking-tight sm:text-[34px]">
            O seu cartão fidelidade
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Entre com a Google para ver os seus pontos, resgatar recompensas e
            guardar os cupons.
          </p>

          {erro && (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
              <AlertCircle className="mt-px h-4 w-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div className="mt-8">
            {/* Google primeiro e em destaque: é o caminho sem confirmação de
             * email, já que a Google garante o endereço na hora. */}
            <GoogleSignInButton next={safeNext} unitSlug={resolvedSlug} />

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[12px] text-muted-foreground">ou por email</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <EmailAuthForm next={safeNext} />
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Ao entrar aceita os{" "}
            <Link href="/termos" className="underline underline-offset-2">
              termos
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="underline underline-offset-2">
              política de privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );

  if (!shellUnit) return <main className="flex-1">{content}</main>;

  return (
    <ClientShell unit={shellUnit} units={units}>
      {content}
    </ClientShell>
  );
}
