import { requireRole } from "@/lib/admin-auth";

export default async function OperacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["super_admin", "manager", "barbeiro"]);
  return <>{children}</>;
}
