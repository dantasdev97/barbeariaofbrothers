import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Estado do cartão para quem está a ver a página.
 *
 * O cabeçalho e o botão fixo precisam ambos da mesma resposta — "esta
 * pessoa já tem cartão?" — para decidirem se convidam a criar conta ou se
 * levam directamente ao cartão.
 *
 * Não usa `getMyAccount()` de propósito: essa traz saldos, transacções,
 * cupons, recompensas e serviços, e aqui só interessa saber se a linha
 * existe. Isto corre em todas as páginas públicas da unidade.
 */
export type CardState = { signedIn: boolean; hasCard: boolean };

const SIGNED_OUT: CardState = { signedIn: false, hasCard: false };

export async function getCardState(): Promise<CardState> {
  // Isto corre no layout de todas as páginas públicas da unidade. Sem as
  // variáveis do Supabase (ou com a base em baixo) o site inteiro deixaria
  // de abrir por causa de um ícone — degrada para "sem sessão".
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return SIGNED_OUT;
  }

  try {
    const sb = await createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) return SIGNED_OUT;

    const { data } = await sb
      .from("clients")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    return { signedIn: true, hasCard: !!data };
  } catch (err) {
    console.error("[getCardState]", err);
    return SIGNED_OUT;
  }
}
