import { createAdminClient } from "@/lib/supabase/admin";
import { BarbersClient } from "./barbers-client";

export default async function BarbersAdminPage() {
  const sb = createAdminClient();
  const [{ data: barbers }, { data: units }] = await Promise.all([
    sb.from("barbers").select("*").order("display_order"),
    sb.from("units").select("id, name, slug").order("name"),
  ]);

  return <BarbersClient barbers={barbers ?? []} units={units ?? []} />;
}
