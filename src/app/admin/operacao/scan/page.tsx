import { requireRole } from "@/lib/admin-auth";
import { Scanner } from "./scanner";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  await requireRole(["super_admin", "manager", "barbeiro"]);
  return <Scanner />;
}
