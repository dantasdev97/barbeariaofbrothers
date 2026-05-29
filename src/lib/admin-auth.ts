import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRole, ProfileRow } from "@/types/database.types";

export type AdminSession = {
  user: {
    id: string;
    email?: string;
  };
  profile: ProfileRow;
};

export async function requireAdminSession(): Promise<AdminSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");

  return {
    user: {
      id: user.id,
      email: user.email ?? undefined,
    },
    profile: profile as ProfileRow,
  };
}

export async function assertAdmin() {
  const { user } = await requireAdminSession();
  return user;
}

/**
 * Garante que o utilizador autenticado tem uma das roles permitidas.
 * Barbeiros tentando aceder a páginas de configuração vão para /admin/operacao.
 */
export async function requireRole(allowed: ProfileRole[]): Promise<AdminSession> {
  const session = await requireAdminSession();
  if (!allowed.includes(session.profile.role)) {
    if (session.profile.role === "barbeiro") redirect("/admin/operacao");
    redirect("/admin");
  }
  return session;
}
