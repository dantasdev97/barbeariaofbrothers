"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/admin-auth";
import type { ProfileRole } from "@/types/database.types";

/**
 * Criação de acessos/logins para a equipa.
 *
 * Só o `super_admin` (dono) pode criar acessos — defesa contra escalada de
 * privilégios. As passwords são escolhidas pelo dono no painel; o servidor
 * usa o service role apenas para criar o utilizador no Supabase Auth e o
 * respetivo `profiles.role`.
 */
async function requireSuperAdmin() {
  const { profile } = await requireAdminSession();
  if (profile.role !== "super_admin") {
    throw new Error("Apenas o administrador principal pode criar acessos.");
  }
}

function validateCredentials(email: string, password: string) {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    throw new Error("Email inválido.");
  }
  if (password.length < 8) {
    throw new Error("A password tem de ter pelo menos 8 caracteres.");
  }
  return e;
}

/**
 * Cria um login de gestão (dono/manager) — sem ligação a um registo de barbeiro.
 * `unitId` é opcional para super_admin (acesso global) e recomendado para manager.
 */
export async function createStaffUser(input: {
  email: string;
  password: string;
  role: Extract<ProfileRole, "manager" | "super_admin">;
  unitId: string | null;
}) {
  await requireSuperAdmin();
  if (input.role !== "manager" && input.role !== "super_admin") {
    throw new Error("Role inválido.");
  }
  const email = validateCredentials(input.email, input.password);
  const sb = createAdminClient();

  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
  });
  if (createErr || !created?.user) {
    throw new Error(createErr?.message ?? "Falhou criar o utilizador.");
  }

  const { error: profErr } = await sb.from("profiles").upsert({
    id: created.user.id,
    role: input.role,
    unit_id: input.unitId,
  });
  if (profErr) {
    // rollback do auth user para não deixar conta órfã sem perfil
    await sb.auth.admin.deleteUser(created.user.id);
    throw new Error(profErr.message);
  }

  revalidatePath("/admin/barbeiros");
  return { ok: true };
}

/**
 * Cria o login de um barbeiro existente e liga-o ao registo em `barbers`.
 * Reescrito aqui (em vez de reutilizar loyalty/actions) para validar
 * credenciais e impedir duplicação quando o barbeiro já tem acesso.
 */
export async function createBarberAccess(
  barberId: string,
  email: string,
  password: string,
) {
  await requireSuperAdmin();
  const finalEmail = validateCredentials(email, password);
  const sb = createAdminClient();

  const { data: barber, error: bErr } = await sb
    .from("barbers")
    .select("id, unit_id, name, auth_user_id")
    .eq("id", barberId)
    .single();
  if (bErr || !barber) throw new Error("Barbeiro não encontrado.");
  if (barber.auth_user_id) {
    throw new Error("Este barbeiro já tem um acesso criado.");
  }

  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email: finalEmail,
    password,
    email_confirm: true,
  });
  if (createErr || !created?.user) {
    throw new Error(createErr?.message ?? "Falhou criar o utilizador.");
  }
  const userId = created.user.id;

  const { error: profErr } = await sb.from("profiles").upsert({
    id: userId,
    role: "barbeiro",
    unit_id: barber.unit_id,
  });
  if (profErr) {
    await sb.auth.admin.deleteUser(userId);
    throw new Error(profErr.message);
  }

  const { error: linkErr } = await sb
    .from("barbers")
    .update({ auth_user_id: userId })
    .eq("id", barberId);
  if (linkErr) {
    await sb.auth.admin.deleteUser(userId);
    throw new Error(linkErr.message);
  }

  revalidatePath("/admin/barbeiros");
  return { ok: true };
}
