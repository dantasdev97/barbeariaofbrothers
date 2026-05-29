import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { ClientForm } from "../client-form";

export default async function NovoClientePage() {
  const { profile } = await requireRole(["super_admin", "manager"]);
  const sb = createAdminClient();
  const { data: units } = await sb.from("units").select("id, name, slug").order("name");

  const defaultUnitId = profile.unit_id ?? units?.[0]?.id ?? "";

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-7 border-b border-border pb-6">
        <h1 className="font-heading text-[28px] font-semibold leading-none tracking-tight">
          Novo cliente
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Cadastra o cliente e gera o QR Code do cartão fidelidade.
        </p>
      </header>
      <ClientForm units={units ?? []} defaultUnitId={defaultUnitId} />
    </div>
  );
}
