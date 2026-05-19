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

  const uid = user.id;
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "MISSING";
  const supaRef = supaUrl.match(/https:\/\/([^.]+)\./)?.[1] ?? "?";
  console.log(`[a-a] uid=${uid} ref=${supaRef} key=${Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)} found=${Boolean(profile)}`);
  if (profileError) console.error("[a-a] err:", JSON.stringify(profileError));
  if (!profile) {
    console.error(`[a-a] NOPROFILE uid=${uid} ref=${supaRef}`);
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
