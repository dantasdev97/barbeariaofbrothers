import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  const user = userRes?.user ?? null;

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const supaRef = supaUrl?.match(/https:\/\/([^.]+)\./)?.[1] ?? null;
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  let profile: unknown = null;
  let profileErr: unknown = null;
  if (user && hasServiceKey) {
    const admin = createAdminClient();
    const r = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
    profile = r.data;
    profileErr = r.error;
  }

  return NextResponse.json({
    supabaseRef: supaRef,
    hasServiceKey,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    userErr: userErr?.message ?? null,
    profile,
    profileErr: profileErr ? JSON.stringify(profileErr) : null,
  });
}
