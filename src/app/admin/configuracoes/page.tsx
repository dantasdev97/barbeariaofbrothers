import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { ConfigClient } from "./config-client";

export default async function ConfigPage() {
  await requireRole(["super_admin"]);
  const sb = createAdminClient();
  const { data: units } = await sb
    .from("units")
    .select("*")
    .order("created_at");

  return <ConfigClient units={units ?? []} />;
}
