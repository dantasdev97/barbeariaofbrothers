import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { PageHeader } from "@/components/admin/page-header";
import { ClientForm } from "../client-form";

export default async function NovoClientePage() {
  const { profile } = await requireRole(["super_admin", "manager"]);
  const sb = createAdminClient();
  const { data: units } = await sb.from("units").select("id, name, slug").order("name");

  const defaultUnitId = profile.unit_id ?? units?.[0]?.id ?? "";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Novo cliente"
        description="Cadastra o cliente e gera o QR Code do cartão fidelidade."
      />
      <ClientForm units={units ?? []} defaultUnitId={defaultUnitId} />
    </div>
  );
}
