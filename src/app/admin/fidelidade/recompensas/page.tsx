import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { RewardsManager } from "./rewards-manager";

export const dynamic = "force-dynamic";

export default async function RecompensasPage() {
  await requireRole(["super_admin", "manager"]);
  const sb = createAdminClient();
  const [{ data: rewards }, { data: units }] = await Promise.all([
    sb.from("loyalty_rewards").select("*").order("points_cost"),
    sb.from("units").select("id, name, slug").order("name"),
  ]);

  return <RewardsManager rewards={rewards ?? []} units={units ?? []} />;
}
