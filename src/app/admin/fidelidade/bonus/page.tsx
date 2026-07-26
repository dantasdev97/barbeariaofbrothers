import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { BonusManager } from "./bonus-manager";

export const dynamic = "force-dynamic";

export default async function BonusPage() {
  await requireRole(["super_admin", "manager"]);
  const sb = createAdminClient();
  const [{ data: bonuses }, { data: units }] = await Promise.all([
    sb.from("loyalty_bonuses").select("*"),
    sb.from("units").select("id, name, slug").order("name"),
  ]);

  return <BonusManager bonuses={bonuses ?? []} units={units ?? []} />;
}
