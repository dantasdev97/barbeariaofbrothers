import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { UnitsClient } from "./units-client";

export default async function UnitsPage() {
  await requireRole(["super_admin"]);
  const sb = createAdminClient();
  const { data: units } = await sb
    .from("units")
    .select("*")
    .order("created_at", { ascending: true });

  return <UnitsClient units={units ?? []} />;
}
