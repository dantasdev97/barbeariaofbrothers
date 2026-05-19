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
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Identity is proven by getUser() above; bypass RLS for the own-profile
  // lookup so misconfigured policies can't cause spurious /login redirects.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");
  if (profile.role !== "super_admin" && profile.role !== "manager") {
    redirect("/login");
  }

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
