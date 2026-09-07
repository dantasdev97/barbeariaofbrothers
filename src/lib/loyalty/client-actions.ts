"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCouponEmail } from "@/lib/email/coupon";
import { normalizeInstagramHandle } from "@/lib/loyalty/instagram";
import { normalizePhonePT, PHONE_HINT } from "@/lib/loyalty/phone";
import type {
  ClientRow,
  LoyaltyBonusKind,
  LoyaltyCouponRow,
  LoyaltyRewardRow,
  LoyaltyServiceRow,
  LoyaltyTransactionRow,
  UnitRow,
} from "@/types/database.types";

/**
 * Acções do lado do **cliente** — distintas de `actions.ts`, que é do staff.
 *
 * Todas correm com a sessão do próprio utilizador (nunca service role): quem
 * decide o que ele pode fazer são as RPCs `security definer` e as policies
 * de RLS da migração 0007, não este ficheiro. Assim não há caminho em que um
 * erro aqui dê acesso ao cartão de outra pessoa.
 */

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Traduz erros do Postgres em frases que o cliente entende. */
function toMessage(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (!raw) return fallback;
  if (raw.includes("auth required")) return "Precisa de iniciar sessão.";
  if (raw.includes("saldo insuficiente")) return "Pontos insuficientes.";
  if (raw.includes("bónus já atribuído")) return "Este bónus já foi atribuído.";
  if (raw.includes("conta sem cartão")) {
    return "A sua conta ainda não está ligada a um cartão.";
  }
  if (raw.includes("telefone já associado")) {
    return "Este número já está associado a outro cartão.";
  }
  if (raw.includes("telefone inválido")) return PHONE_HINT;
  // A RPC do telefone chega na migração 0014. Enquanto ela não correr no
  // Supabase, o PostgREST responde "Could not find the function" — que não é
  // frase para mostrar a um cliente. O resto da página continua a funcionar.
  if (raw.includes("Could not find the function")) {
    return "Esta opção ainda não está disponível. Tente mais tarde.";
  }
  return raw;
}

/**
 * Cria um cartão novo para quem acabou de se registar.
 *
 * É o único caminho: não há cartões físicos. A pessoa entra com o Google,
 * escolhe a barbearia, e o cartão nasce com o bónus de registo incluído.
 */
export async function createMyCard(
  unitId: string,
  name?: string,
): Promise<ActionResult<ClientRow>> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("loyalty_create_card", {
    p_unit_id: unitId,
    p_name: name?.trim() || null,
  });

  if (error) {
    return { ok: false, error: toMessage(error, "Não foi possível criar o cartão.") };
  }

  revalidatePath("/minha-conta");
  return { ok: true, data: data as ClientRow };
}

/**
 * Resgate feito pelo próprio cliente. Desconta os pontos e devolve o cupom.
 *
 * O email é secundário de propósito: se o envio falhar (ou não houver chave
 * configurada) o resgate continua válido — o cupom já existe na base e
 * aparece no ecrã. Falhar o resgate por causa do email seria perder pontos
 * do cliente por um problema de infraestrutura.
 */
export async function selfRedeem(
  rewardId: string,
  unitId: string,
): Promise<ActionResult<LoyaltyCouponRow>> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("loyalty_self_redeem", {
    p_reward_id: rewardId,
    p_unit_id: unitId,
  });

  if (error) return { ok: false, error: toMessage(error, "Não foi possível resgatar.") };

  const coupon = data as LoyaltyCouponRow;

  try {
    const admin = createAdminClient();
    const [{ data: client }, { data: unit }] = await Promise.all([
      admin.from("clients").select("name, email").eq("id", coupon.client_id).maybeSingle(),
      admin.from("units").select("name").eq("id", coupon.unit_id).maybeSingle(),
    ]);

    if (client?.email) {
      await sendCouponEmail({
        to: client.email,
        clientName: client.name,
        unitName: unit?.name ?? "Of Brothers",
        coupon,
      });
    }
  } catch (err) {
    console.error("[selfRedeem] envio de email falhou", err);
  }

  revalidatePath("/minha-conta");
  return { ok: true, data: coupon };
}


/**
 * O cliente define como quer ser tratado.
 *
 * Só muda o nome à vista. O `public_slug` fica como está: é o que vai no QR e
 * nos links já partilhados, e mudá-lo partia cartões que já andam por aí.
 */
export async function setMyDisplayName(
  name: string,
): Promise<ActionResult<ClientRow>> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("loyalty_set_display_name", {
    p_name: name.trim(),
  });

  if (error) return { ok: false, error: toMessage(error, "Não foi possível guardar o nome.") };

  revalidatePath("/minha-conta");
  return { ok: true, data: data as ClientRow };
}

/**
 * O cliente acrescenta ou corrige o seu telefone.
 *
 * Opcional: quem entra pela Google só deixa email, e o cartão funciona sem
 * número nenhum. Serve para a barbearia poder avisar de uma marcação — não
 * é uma condição para ter pontos.
 *
 * Uma string vazia limpa o número, para quem o quiser retirar. Normalizamos
 * aqui e a função valida outra vez do outro lado.
 */
export async function setMyPhone(
  raw: string,
): Promise<ActionResult<ClientRow>> {
  const trimmed = raw.trim();
  const phone = trimmed ? normalizePhonePT(trimmed) : null;
  if (trimmed && !phone) return { ok: false, error: PHONE_HINT };

  const sb = await createClient();
  const { data, error } = await sb.rpc("loyalty_set_phone", { p_phone: phone });

  if (error) {
    return {
      ok: false,
      error: toMessage(error, "Não foi possível guardar o telefone."),
    };
  }

  revalidatePath("/minha-conta");
  return { ok: true, data: data as ClientRow };
}

/** Bónus de registo e de Instagram — uma vez por cliente, garantido no índice. */
export async function grantBonus(
  kind: "signup" | "instagram",
  unitId: string,
  /** Obrigatório em `instagram`: o @ do cliente, para se poder conferir. */
  handle?: string,
): Promise<ActionResult<LoyaltyTransactionRow>> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("loyalty_grant_bonus", {
    p_kind: kind,
    p_unit_id: unitId,
    p_handle: handle ? normalizeInstagramHandle(handle) : null,
  });

  if (error) return { ok: false, error: toMessage(error, "Não foi possível atribuir o bónus.") };

  revalidatePath("/minha-conta");
  return { ok: true, data: data as LoyaltyTransactionRow };
}

// ---------------------------------------------------------------------
// Leituras
// ---------------------------------------------------------------------

export type ClientBonuses = {
  signup: { points: number; active: boolean };
  instagram: { points: number; active: boolean };
};

export type ClientAccount = {
  client: ClientRow;
  unit: UnitRow | null;
  balance: number;
  transactions: LoyaltyTransactionRow[];
  coupons: LoyaltyCouponRow[];
  rewards: LoyaltyRewardRow[];
  services: LoyaltyServiceRow[];
  claimedBonuses: LoyaltyBonusKind[];
  bonuses: ClientBonuses;
};

/**
 * Tudo o que o cartão do cliente precisa, numa ida à base.
 *
 * Devolve `null` quando o utilizador está autenticado mas ainda não tem
 * cartão — é esse o estado que faz a página mostrar a escolha da
 * barbearia.
 */
export async function getMyAccount(): Promise<ClientAccount | null> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data: client } = await sb
    .from("clients")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!client) return null;
  const c = client as ClientRow;

  const [balances, txs, coupons, rewards, services, unit, bonusRows] = await Promise.all([
    sb.from("client_unit_balances").select("unit_id, balance").eq("client_id", c.id),
    // 200 e não 20: o histórico agrupa por mês e mostra 10 de cada vez, e as
    // estatísticas do cartão (visitas, pontos ganhos) somam esta mesma lista
    // em vez de fazer uma segunda ida à base. São linhas pequenas; um cliente
    // com 200 movimentos é um cliente de muitos anos.
    sb
      .from("loyalty_transactions")
      .select("*")
      .eq("client_id", c.id)
      .order("created_at", { ascending: false })
      .limit(200),
    sb
      .from("loyalty_coupons")
      .select("*")
      .eq("client_id", c.id)
      .order("created_at", { ascending: false })
      .limit(20),
    sb
      .from("loyalty_rewards")
      .select("*")
      .eq("unit_id", c.unit_id)
      .eq("active", true)
      .order("points_cost"),
    sb
      .from("loyalty_services")
      .select("*")
      .eq("unit_id", c.unit_id)
      .eq("active", true)
      .order("display_order"),
    sb.from("units").select("*").eq("id", c.unit_id).maybeSingle(),
    sb
      .from("loyalty_bonuses")
      .select("kind, points, active")
      .eq("unit_id", c.unit_id),
  ]);

  const balance =
    (balances.data ?? []).find((b) => b.unit_id === c.unit_id)?.balance ?? 0;

  const transactions = (txs.data ?? []) as LoyaltyTransactionRow[];

  // RLS só devolve linhas activas (política pública de leitura) — sem
  // linha significa desactivado ou ainda por configurar, nunca "50/30
  // por omissão": quem configura no painel é o dono, não este ficheiro.
  const bonusList = (bonusRows.data ?? []) as {
    kind: LoyaltyBonusKind;
    points: number;
    active: boolean;
  }[];
  const findBonus = (kind: LoyaltyBonusKind) => bonusList.find((b) => b.kind === kind);
  const bonuses: ClientBonuses = {
    signup: { points: findBonus("signup")?.points ?? 10, active: findBonus("signup")?.active ?? false },
    instagram: {
      points: findBonus("instagram")?.points ?? 15,
      active: findBonus("instagram")?.active ?? false,
    },
  };

  return {
    client: c,
    unit: (unit.data as UnitRow) ?? null,
    balance,
    transactions,
    coupons: (coupons.data ?? []) as LoyaltyCouponRow[],
    rewards: (rewards.data ?? []) as LoyaltyRewardRow[],
    services: (services.data ?? []) as LoyaltyServiceRow[],
    claimedBonuses: transactions
      .map((t) => t.bonus_kind)
      .filter((k): k is LoyaltyBonusKind => !!k),
    bonuses,
  };
}
