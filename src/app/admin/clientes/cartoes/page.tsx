import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { PageHeader } from "@/components/admin/page-header";
import { CardsExport } from "./cards-export";

export default async function CartoesPage() {
  await requireRole(["super_admin", "manager"]);
  const sb = createAdminClient();

  const [{ data: clients }, { data: units }] = await Promise.all([
    sb
      .from("clients")
      .select("id, name, phone, qr_token, unit_id, created_at")
      .order("created_at", { ascending: false }),
    sb.from("units").select("id, name, slug").order("name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Cartões para gráfica"
        description="Seleciona clientes e exporta uma folha A4 (8 cartões 85×54 mm) para imprimir. Recomendado: imprimir em papel cartão 350g."
      />

      <CardsExport clients={clients ?? []} units={units ?? []} />
    </div>
  );
}
