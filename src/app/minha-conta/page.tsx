import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllUnits, getUnitBySlug } from "@/lib/data";
import { getMyAccount } from "@/lib/loyalty/client-actions";
import { ClientShell } from "@/components/cliente/client-shell";
import { MyCard } from "./my-card";
import { StartCard } from "./start-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "O meu cartão",
  robots: { index: false, follow: false },
};

export default async function MinhaContaPage({
  searchParams,
}: {
  searchParams: Promise<{ unidade?: string }>;
}) {
  const { unidade } = await searchParams;
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    const next = unidade ? `/minha-conta?unidade=${unidade}` : "/minha-conta";
    redirect(`/entrar?next=${encodeURIComponent(next)}`);
  }

  let account = await getMyAccount();
  const units = await getAllUnits();

  // Autenticado mas ainda sem cartão. Quem veio de `/programa?unidade=X`
  // traz o slug: a barbearia já é conhecida e voltar a perguntá-la é um
  // passo a mais entre o registo e o cartão. Cria-se e mostra-se.
  //
  // Chamamos a RPC directamente em vez da acção `createMyCard`: essa faz
  // `revalidatePath`, que o Next não permite durante o render de uma
  // página. A RPC é idempotente (0007 devolve o cartão existente se já
  // houver um para este `auth_user_id`), por isso não duplica nada.
  if (!account && unidade) {
    const unit = await getUnitBySlug(unidade);
    if (unit) {
      const { error } = await sb.rpc("loyalty_create_card", {
        p_unit_id: unit.id,
        p_name: null,
      });
      if (error) {
        console.error("[minha-conta] criação automática do cartão falhou", error);
      } else {
        account = await getMyAccount();
      }
    }
  }

  // Sem cartão e sem unidade conhecida (entrou directo por `/entrar`, ou o
  // slug não resolveu). Associar alguém à barbearia errada em silêncio
  // seria pior do que um toque a mais: pergunta-se.
  if (!account) {
    const fallbackUnit = units[0] ?? null;
    const start = (
      <StartCard
        units={units.map((u) => ({ id: u.id, name: u.name }))}
        defaultName={
          (user.user_metadata?.full_name as string | undefined) ??
          user.email?.split("@")[0] ??
          ""
        }
      />
    );
    if (!fallbackUnit) return <main className="flex-1">{start}</main>;
    return (
      <ClientShell unit={fallbackUnit} units={units} hasCard={false}>
        {start}
      </ClientShell>
    );
  }

  const shellUnit = account.unit ?? units[0] ?? null;
  const card = <MyCard account={account} />;
  if (!shellUnit) return <main className="flex-1">{card}</main>;

  return (
    <ClientShell unit={shellUnit} units={units} hasCard>
      {card}
    </ClientShell>
  );
}
