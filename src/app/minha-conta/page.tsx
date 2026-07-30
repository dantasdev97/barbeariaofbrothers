import { redirect } from "next/navigation";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { cardUrl } from "@/lib/loyalty/qr";
import { getLoyaltyUnits, getUnitBySlug } from "@/lib/data";
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
  const units = await getLoyaltyUnits();

  // Autenticado mas ainda sem cartão. Quem veio de `/programa?unidade=X`
  // traz o slug: a barbearia já é conhecida e voltar a perguntá-la é um
  // passo a mais entre o registo e o cartão. Cria-se e mostra-se.
  //
  // Chamamos a RPC directamente em vez da acção `createMyCard`: essa faz
  // `revalidatePath`, que o Next não permite durante o render de uma
  // página. A RPC é idempotente (0007 devolve o cartão existente se já
  // houver um para este `auth_user_id`), por isso não duplica nada.
  //
  // `autoError` guarda porque é que falhou. Sem isto o ecrã caía calado no
  // selector de unidades e não havia como saber se o problema foi a unidade
  // não ter chegado ou a base ter recusado — que são causas opostas.
  let autoError: string | null = null;

  if (!account) {
    if (!unidade) {
      autoError = "não recebi a barbearia de onde veio";
    } else {
      const unit = await getUnitBySlug(unidade);
      if (!unit) {
        autoError = `a barbearia "${unidade}" não foi encontrada`;
      } else {
        const { error } = await sb.rpc("loyalty_create_card", {
          p_unit_id: unit.id,
          p_name: null,
        });
        if (error) {
          console.error("[minha-conta] criação automática do cartão falhou", error);
          autoError = error.message;
        } else {
          account = await getMyAccount();
        }
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
        autoError={autoError}
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

  // O QR é gerado aqui porque o `my-card` é client component. Leva o
  // `public_slug` (mais legível que o token) e é lido pelo scanner do
  // barbeiro em /admin/operação/scan, que abre o ecrã deste cliente.
  const qrDataUrl = await QRCode.toDataURL(
    cardUrl(account.client.public_slug ?? account.client.qr_token),
    {
      margin: 1,
      width: 600,
      errorCorrectionLevel: "M",
      color: { dark: "#0A0A0A", light: "#ffffff" },
    },
  );

  const card = <MyCard account={account} qrDataUrl={qrDataUrl} />;
  if (!shellUnit) return <main className="flex-1">{card}</main>;

  return (
    <ClientShell unit={shellUnit} units={units} hasCard>
      {card}
    </ClientShell>
  );
}
