import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database.types";

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

  // No profile row → treat as super_admin (matches prior behaviour; signups
  // are disabled so the only auth users are ones the owner created manually).
  const resolvedProfile: ProfileRow =
    (profile as ProfileRow | null) ?? {
      id: user.id,
      role: "super_admin",
      unit_id: null,
      created_at: new Date().toISOString(),
    };

  return {
    user: {
      id: user.id,
      email: user.email ?? undefined,
    },
    profile: resolvedProfile,
  };
}

export async function assertAdmin() {
  const { user } = await requireAdminSession();
  return user;
}
