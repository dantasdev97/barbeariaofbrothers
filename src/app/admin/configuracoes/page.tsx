import { createAdminClient } from "@/lib/supabase/admin";
import { ConfigClient } from "./config-client";

export default async function ConfigPage() {
  const sb = createAdminClient();
  const { data: units } = await sb
    .from("units")
    .select("*")
    .order("created_at");

  return <ConfigClient units={units ?? []} />;
}
