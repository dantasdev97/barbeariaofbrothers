import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/admin-auth";
import { UnitsClient } from "./units-client";

export default async function UnitsPage() {
  await requireAdminSession();
  const sb = createAdminClient();
  const { data: units } = await sb
    .from("units")
    .select("*")
    .order("created_at", { ascending: true });

  return <UnitsClient units={units ?? []} />;
}
