import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/admin-auth";
import { ConfigClient } from "./config-client";

export default async function ConfigPage() {
  await requireAdminSession();
  const sb = createAdminClient();
  const { data: units } = await sb
    .from("units")
    .select("*")
    .order("created_at");

  return <ConfigClient units={units ?? []} />;
}
