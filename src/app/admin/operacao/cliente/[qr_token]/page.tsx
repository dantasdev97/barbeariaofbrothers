import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import {
  getActiveRewards,
  getActiveServices,
  getClientBalance,
  getRecentTransactions,
} from "@/lib/loyalty/queries";
import { OperacaoCliente } from "./operacao-cliente";

export const dynamic = "force-dynamic";

export default async function ClienteOperacaoPage({
  params,
}: {
  params: Promise<{ qr_token: string }>;
}) {
  const { profile } = await requireRole(["super_admin", "manager", "barbeiro"]);
  const { qr_token } = await params;

  const sb = createAdminClient();
  const { data: client } = await sb
    .from("clients")
    .select("*")
    .eq("qr_token", qr_token)
    .maybeSingle();

  if (!client) notFound();

  // Unidade da operação:
  //  - super_admin sem unit_id → unidade de cadastro do cliente
  //  - manager/barbeiro → unidade do seu perfil (a casa onde está a operar)
  const operatingUnitId = profile.unit_id ?? client.unit_id;

  const [balance, transactions, services, rewards, { data: unit }] = await Promise.all([
    getClientBalance(client.id, operatingUnitId),
    getRecentTransactions(client.id, operatingUnitId, 5),
    getActiveServices(operatingUnitId),
    getActiveRewards(operatingUnitId),
    sb.from("units").select("name").eq("id", operatingUnitId).maybeSingle(),
  ]);

  return (
    <OperacaoCliente
      client={client}
      unitId={operatingUnitId}
      unitName={unit?.name ?? "Of Brothers"}
      balance={balance}
      transactions={transactions}
      services={services}
      rewards={rewards}
    />
  );
}
