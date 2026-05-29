"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/admin-auth";
import { generateQrToken } from "@/lib/loyalty/qr";

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

export async function saveClient(input: ClientInput): Promise<{ id: string; qr_token: string }> {
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
      .select("id, qr_token")
      .single();
    if (error) throw new Error(error.message);
    bust();
    return { id: data.id, qr_token: data.qr_token };
  }

  // Insert: gera qr_token único (raríssimo colidir, mas validamos)
  let attempts = 0;
  while (attempts < 5) {
    const token = generateQrToken();
    const { data, error } = await sb
      .from("clients")
      .insert({
        unit_id: input.unit_id,
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        notes: input.notes?.trim() || null,
        qr_token: token,
      })
      .select("id, qr_token")
      .single();
    if (!error && data) {
      bust();
      return { id: data.id, qr_token: data.qr_token };
    }
    if (error && !/qr_token/.test(error.message)) {
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

export async function loyaltyEarn(clientId: string, unitId: string, serviceId: string) {
  await requireRole(["super_admin", "manager", "barbeiro"]);
  const sb = await createClient();
  const { data, error } = await sb.rpc("loyalty_earn", {
    p_client_id: clientId,
    p_unit_id: unitId,
    p_service_id: serviceId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/operacao", "layout");
  revalidatePath(`/cliente`, "layout");
  return data;
}

export async function loyaltyRedeem(clientId: string, unitId: string, rewardId: string) {
  await requireRole(["super_admin", "manager", "barbeiro"]);
  const sb = await createClient();
  const { data, error } = await sb.rpc("loyalty_redeem", {
    p_client_id: clientId,
    p_unit_id: unitId,
    p_reward_id: rewardId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/operacao", "layout");
  revalidatePath(`/cliente`, "layout");
  return data;
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
// Navigation helper — usado pelo scan
// ---------------------------------------------------------------------

export async function gotoClientByToken(token: string) {
  await requireRole(["super_admin", "manager", "barbeiro"]);
  const t = token.trim();
  // Aceita URL completa ou só token
  const match = t.match(/cliente\/([A-Z0-9-]+)/i);
  const finalToken = match?.[1] ?? t;
  redirect(`/admin/operacao/cliente/${finalToken}`);
}
