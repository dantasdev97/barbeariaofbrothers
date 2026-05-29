import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { ServicesManager } from "./services-manager";

export const dynamic = "force-dynamic";

export default async function ServicosPage() {
  await requireRole(["super_admin", "manager"]);
  const sb = createAdminClient();
  const [{ data: services }, { data: units }] = await Promise.all([
    sb.from("loyalty_services").select("*").order("display_order"),
    sb.from("units").select("id, name, slug").order("name"),
  ]);

  return <ServicesManager services={services ?? []} units={units ?? []} />;
}
