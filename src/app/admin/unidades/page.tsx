import { createAdminClient } from "@/lib/supabase/admin";
import { UnitsClient } from "./units-client";

export default async function UnitsPage() {
  const sb = createAdminClient();
  const { data: units } = await sb
    .from("units")
    .select("*")
    .order("created_at", { ascending: true });

  return <UnitsClient units={units ?? []} />;
}
