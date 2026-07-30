"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/admin-auth";
import { extractHandle } from "@/lib/loyalty/handle";
import { generatePublicSlug, generateQrToken } from "@/lib/loyalty/qr";
import type { LoyaltyRewardKind } from "@/types/database.types";

async function requireRole(roles: Array<"super_admin" | "manager" | "barbeiro">) {
  const { user, profile } = await requireAdminSession();
  if (!roles.includes(profile.role)) {
    throw new Error("Sem permissão.");
  }
  return { user, profile };
}

function bust() {
  revalidatePath("/admin/clientes");
  revalidatePath("/admin/fidelidade", "layout");
  revalidatePath("/admin/operacao", "layout");
}

// ---------------------------------------------------------------------
// CLIENTS
// ---------------------------------------------------------------------

type ClientInput = {
  id?: string;
  unit_id: string;
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
};

export async function saveClient(
  input: ClientInput,
): Promise<{ id: string; qr_token: string; public_slug: string }> {
  await requireRole(["super_admin", "manager"]);
  const sb = createAdminClient();

  if (input.id) {
    const { data, error } = await sb
      .from("clients")
      .update({
        unit_id: input.unit_id,
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        notes: input.notes?.trim() || null,
      })
      .eq("id", input.id)
      .select("id, qr_token, public_slug")
      .single();
    if (error) throw new Error(error.message);
    bust();
    return { id: data.id, qr_token: data.qr_token, public_slug: data.public_slug };
  }

  // Insert: gera qr_token + public_slug únicos (raríssimo colidir, mas validamos)
  let attempts = 0;
  while (attempts < 5) {
    const token = generateQrToken();
    const slug = generatePublicSlug(input.name);
    const { data, error } = await sb
      .from("clients")
      .insert({
        unit_id: input.unit_id,
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        notes: input.notes?.trim() || null,
        qr_token: token,
        public_slug: slug,
      })
      .select("id, qr_token, public_slug")
      .single();
    if (!error && data) {
      bust();
      return {
        id: data.id,
        qr_token: data.qr_token,
        public_slug: data.public_slug,
      };
    }
    if (error && !/qr_token|public_slug/.test(error.message)) {
      throw new Error(error.message);
    }
    attempts++;
  }
  throw new Error("Não foi possível gerar QR único.");
}

export async function deleteClient(id: string) {
  await requireRole(["super_admin"]);
  const sb = createAdminClient();
  const { error } = await sb.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
  bust();
}

// ---------------------------------------------------------------------
// LOYALTY SERVICES (CRUD)
// ---------------------------------------------------------------------

type ServiceInput = {
  id?: string;
  unit_id: string;
  name: string;
  points_value: number;
  display_order?: number;
  active?: boolean;
};

export async function saveLoyaltyService(input: ServiceInput) {
  await requireRole(["super_admin", "manager"]);
  const sb = createAdminClient();
  const payload = {
    unit_id: input.unit_id,
    name: input.name.trim(),
    points_value: input.points_value,
    display_order: input.display_order ?? 0,
    active: input.active ?? true,
  };
  if (input.id) {
    const { error } = await sb.from("loyalty_services").update(payload).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from("loyalty_services").insert(payload);
    if (error) throw new Error(error.message);
  }
  bust();
}

export async function deleteLoyaltyService(id: string) {
  await requireRole(["super_admin", "manager"]);
  const sb = createAdminClient();
  const { error } = await sb.from("loyalty_services").delete().eq("id", id);
  if (error) throw new Error(error.message);
  bust();
}

// ---------------------------------------------------------------------
// LOYALTY REWARDS (CRUD)
// ---------------------------------------------------------------------

type RewardInput = {
  id?: string;
  unit_id: string;
  name: string;
  description?: string | null;
  points_cost: number;
  /** Tipo pedido pelo dono: serviço, valor fixo, percentagem ou brinde. */
  kind?: LoyaltyRewardKind;
  /** Só para `amount` — em cêntimos, para não guardar float. */
  value_cents?: number | null;
  /** Só para `percent` — 1 a 100. */
  percent?: number | null;
  active?: boolean;
};

export async function saveLoyaltyReward(input: RewardInput) {
  await requireRole(["super_admin", "manager"]);
  const sb = createAdminClient();
  const payload = {
    unit_id: input.unit_id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    points_cost: input.points_cost,
    kind: input.kind ?? "service",
    // Limpa o campo do tipo que não se aplica: sem isto, mudar de "valor
    // fixo" para "serviço" deixava o valor antigo pendurado na linha.
    value_cents: input.kind === "amount" ? (input.value_cents ?? null) : null,
    percent: input.kind === "percent" ? (input.percent ?? null) : null,
    active: input.active ?? true,
  };
  if (input.id) {
    const { error } = await sb.from("loyalty_rewards").update(payload).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from("loyalty_rewards").insert(payload);
    if (error) throw new Error(error.message);
  }
  bust();
}

export async function deleteLoyaltyReward(id: string) {
  await requireRole(["super_admin", "manager"]);
  const sb = createAdminClient();
  const { error } = await sb.from("loyalty_rewards").delete().eq("id", id);
  if (error) throw new Error(error.message);
  bust();
}

// ---------------------------------------------------------------------
// LOYALTY BONUSES (registo / Instagram) — editável por unidade
// ---------------------------------------------------------------------

type BonusInput = {
  unit_id: string;
  signup: { points: number; active: boolean };
  instagram: { points: number; active: boolean };
};

export async function saveLoyaltyBonuses(input: BonusInput) {
  await requireRole(["super_admin", "manager"]);
  const sb = createAdminClient();
  const { error } = await sb.from("loyalty_bonuses").upsert(
    [
      { unit_id: input.unit_id, kind: "signup", points: input.signup.points, active: input.signup.active },
      { unit_id: input.unit_id, kind: "instagram", points: input.instagram.points, active: input.instagram.active },
    ],
    { onConflict: "unit_id,kind" },
  );
  if (error) throw new Error(error.message);
  bust();
  revalidatePath("/programa");
  revalidatePath("/minha-conta");
}

// ---------------------------------------------------------------------
// LINK barbeiro <-> auth user
// ---------------------------------------------------------------------

export async function linkBarberToUser(barberId: string, email: string, password: string) {
  await requireRole(["super_admin"]);
  const sb = createAdminClient();

  const { data: barber, error: bErr } = await sb
    .from("barbers")
    .select("id, unit_id, name")
    .eq("id", barberId)
    .single();
  if (bErr || !barber) throw new Error("Barbeiro não encontrado.");

  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created?.user) throw new Error(createErr?.message ?? "Falhou criar utilizador.");

  const userId = created.user.id;

  const { error: profErr } = await sb.from("profiles").upsert({
    id: userId,
    role: "barbeiro",
    unit_id: barber.unit_id,
  });
  if (profErr) throw new Error(profErr.message);

  const { error: linkErr } = await sb
    .from("barbers")
    .update({ auth_user_id: userId })
    .eq("id", barberId);
  if (linkErr) throw new Error(linkErr.message);

  bust();
  return { ok: true };
}

// ---------------------------------------------------------------------
// RPC wrappers — operação (usa session do utilizador, não service role)
// ---------------------------------------------------------------------

/**
 * Erros esperados são devolvidos, não lançados: o Next redige exceções de
 * Server Actions em produção e o cliente recebia apenas um digest genérico,
 * escondendo a razão real da recusa do RPC.
 */
export type OpResult = { ok: true } | { ok: false; error: string; code?: string };

/**
 * Traduz os `errcode` levantados pelos RPCs de fidelidade
 * (`supabase/migrations/0004_loyalty.sql`) para algo utilizável ao balcão.
 */
function describeRpcError(
  error: { message: string; code?: string; details?: string | null; hint?: string | null },
  context: string,
): OpResult {
  console.error(`[${context}]`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });

  const byCode: Record<string, string> = {
    "42501": "Sem permissão para operar nesta unidade.",
    "22023": "Serviço ou recompensa inválido/inativo nesta unidade.",
    "23514": "Saldo insuficiente para este resgate.",
  };

  return {
    ok: false,
    code: error.code,
    error: (error.code && byCode[error.code]) || error.message || "Operação falhou.",
  };
}

/** Revalida as rotas afetadas por uma transação de pontos. */
function bustOperation() {
  revalidatePath("/admin/operacao", "layout");
  // `/cliente` não é uma rota — o cartão público vive em `/cliente/[handle]`,
  // e um caminho com segmento dinâmico exige o `type`.
  revalidatePath("/cliente/[handle]", "page");
}

export async function loyaltyEarn(
  clientId: string,
  unitId: string,
  serviceId: string,
): Promise<OpResult> {
  await requireRole(["super_admin", "manager", "barbeiro"]);
  const sb = await createClient();
  const { error } = await sb.rpc("loyalty_earn", {
    p_client_id: clientId,
    p_unit_id: unitId,
    p_service_id: serviceId,
  });
  if (error) return describeRpcError(error, "loyaltyEarn");
  bustOperation();
  return { ok: true };
}

export async function loyaltyRedeem(
  clientId: string,
  unitId: string,
  rewardId: string,
): Promise<OpResult> {
  await requireRole(["super_admin", "manager", "barbeiro"]);
  const sb = await createClient();
  const { error } = await sb.rpc("loyalty_redeem", {
    p_client_id: clientId,
    p_unit_id: unitId,
    p_reward_id: rewardId,
  });
  if (error) return describeRpcError(error, "loyaltyRedeem");
  bustOperation();
  return { ok: true };
}

export async function loyaltyAdjust(
  clientId: string,
  unitId: string,
  points: number,
  note: string,
) {
  await requireRole(["super_admin"]);
  const sb = await createClient();
  const { data, error } = await sb.rpc("loyalty_adjust", {
    p_client_id: clientId,
    p_unit_id: unitId,
    p_points: points,
    p_note: note,
  });
  if (error) throw new Error(error.message);
  bust();
  return data;
}

// ---------------------------------------------------------------------
// Navigation helpers — usados pelo scan
// ---------------------------------------------------------------------

export async function gotoClientByToken(handle: string) {
  await requireRole(["super_admin", "manager", "barbeiro"]);
  redirect(`/admin/operacao/cliente/${extractHandle(handle)}`);
}

/**
 * Valida um handle (qr_token ou public_slug) e devolve o cliente.
 * Usado pelo scanner para dar feedback verde/vermelho antes de navegar.
 * Não faz redirect — o cliente decide quando navegar.
 */
export async function lookupClient(
  handle: string,
): Promise<
  | { ok: true; handle: string; name: string }
  | { ok: false; error: string }
> {
  await requireRole(["super_admin", "manager", "barbeiro"]);
  if (!handle.trim()) return { ok: false, error: "Handle vazio." };
  const finalHandle = extractHandle(handle);
  if (!finalHandle) return { ok: false, error: "Handle inválido." };

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("clients")
    .select("id, name, public_slug, qr_token")
    .or(`public_slug.eq.${finalHandle},qr_token.eq.${finalHandle}`)
    .maybeSingle();

  if (error) {
    console.error("[lookupClient]", error);
    return { ok: false, error: "Erro a procurar cartão." };
  }
  if (!data) return { ok: false, error: "Cartão não encontrado." };

  // Prefere public_slug (URL amigável) quando existe
  return {
    ok: true,
    handle: data.public_slug ?? data.qr_token,
    name: data.name,
  };
}

// ---------------------------------------------------------------------
// CUPONS — dar baixa no balcão
// ---------------------------------------------------------------------

export type CouponLookup = {
  code: string;
  clientName: string;
  rewardLabel: string;
  rewardKind: LoyaltyRewardKind;
  valueCents: number | null;
  percent: number | null;
  status: "active" | "used" | "expired";
  usedAt: string | null;
  expiresAt: string | null;
};

/** Normaliza o que o barbeiro escreveu: maiúsculas, sem espaços. */
function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Consulta um cupom sem o consumir.
 *
 * Serve para o barbeiro ver de quem é e o que dá **antes** de marcar usado —
 * dar baixa às cegas seria fácil de fazer no cliente errado.
 */
export async function lookupCoupon(code: string): Promise<
  { ok: true; coupon: CouponLookup } | { ok: false; error: string }
> {
  await requireRole(["super_admin", "manager", "barbeiro"]);
  const value = normalizeCode(code);
  if (!value) return { ok: false, error: "Escreva o código." };

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("loyalty_coupons")
    .select("code, reward_label, reward_kind, value_cents, percent, status, used_at, expires_at, clients(name)")
    .eq("code", value)
    .maybeSingle();

  if (error) return { ok: false, error: "Erro a procurar o cupom." };
  if (!data) return { ok: false, error: "Cupom não encontrado." };

  const client = data.clients as unknown as { name: string } | null;
  const expired =
    data.status === "expired" ||
    (!!data.expires_at && new Date(data.expires_at) < new Date());

  return {
    ok: true,
    coupon: {
      code: data.code,
      clientName: client?.name ?? "—",
      rewardLabel: data.reward_label,
      rewardKind: data.reward_kind,
      valueCents: data.value_cents,
      percent: data.percent,
      status: expired && data.status === "active" ? "expired" : data.status,
      usedAt: data.used_at,
      expiresAt: data.expires_at,
    },
  };
}

/**
 * Marca o cupom como usado. É a RPC que impede a reutilização — a segunda
 * tentativa encontra o estado já alterado e recusa.
 */
export async function consumeCoupon(
  code: string,
): Promise<{ ok: true; label: string } | { ok: false; error: string }> {
  await requireRole(["super_admin", "manager", "barbeiro"]);
  const value = normalizeCode(code);
  if (!value) return { ok: false, error: "Escreva o código." };

  const sb = await createClient();
  const { data, error } = await sb.rpc("loyalty_consume_coupon", { p_code: value });

  if (error) {
    const raw = error.message ?? "";
    if (raw.includes("já utilizado")) return { ok: false, error: raw };
    if (raw.includes("expirado")) return { ok: false, error: "Cupom expirado." };
    if (raw.includes("não encontrado")) return { ok: false, error: "Cupom não encontrado." };
    return { ok: false, error: "Não foi possível dar baixa no cupom." };
  }

  revalidatePath("/admin/operacao", "layout");
  return { ok: true, label: (data as { reward_label: string }).reward_label };
}
