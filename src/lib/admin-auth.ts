import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) console.error("[admin-auth] getUser error:", authError.message);
  if (!user) {
    console.error("[admin-auth] no user → redirect /login");
    redirect("/login");
  }

  // Identity is proven by getUser() above; bypass RLS for the own-profile
  // lookup so misconfigured policies can't cause spurious /login redirects.
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) console.error("[admin-auth] profile query error:", profileError.message);
  if (!profile) {
    console.error("[admin-auth] no profile for user:", user.id, user.email);
    redirect("/login");
  }
  if (profile.role !== "super_admin" && profile.role !== "manager") {
    console.error("[admin-auth] role rejected:", profile.role, "user:", user.email);
    redirect("/login");
  }

  console.log("[admin-auth] OK — user:", user.email, "role:", profile.role);
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
