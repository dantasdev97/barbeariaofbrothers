import { notFound } from "next/navigation";
import { requireRole } from "@/lib/admin-auth";
import { getAllUnits } from "@/lib/data";
import {
  getActiveRewards,
  getActiveServices,
  getClientBalance,
  getClientByHandle,
  getRecentTransactions,
} from "@/lib/loyalty/queries";
import { OperacaoCliente } from "./operacao-cliente";

export const dynamic = "force-dynamic";

export default async function ClienteOperacaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ unidade?: string }>;
}) {
  const { profile } = await requireRole(["super_admin", "manager", "barbeiro"]);
  const [{ handle }, { unidade }] = await Promise.all([params, searchParams]);

  const client = await getClientByHandle(handle);
  if (!client) notFound();

  const allUnits = await getAllUnits();

  // Unidades em que este utilizador pode lançar pontos.
  //
  // O RPC `loyalty_earn` recusa qualquer unidade diferente do `profiles.unit_id`
  // de quem não é super_admin (0004_loyalty.sql). Restringir a lista ao que o
  // RPC aceita evita oferecer uma opção que ia falhar ao ser tocada.
  const allowedUnits =
    profile.role === "super_admin" || !profile.unit_id
      ? allUnits
      : allUnits.filter((u) => u.id === profile.unit_id);

  // Unidade de operação: escolha explícita (?unidade=) → unidade do perfil →
  // unidade de cadastro do cliente. A escolha é validada contra `allowedUnits`
  // para que um id colado no URL não contorne o âmbito do perfil.
  const requested = unidade && allowedUnits.some((u) => u.id === unidade) ? unidade : null;
  const fallback =
    profile.unit_id ??
    (allowedUnits.some((u) => u.id === client.unit_id)
      ? client.unit_id
      : allowedUnits[0]?.id ?? client.unit_id);
  const operatingUnitId = requested ?? fallback;

  const [balance, transactions, services, rewards] = await Promise.all([
    getClientBalance(client.id, operatingUnitId),
    getRecentTransactions(client.id, operatingUnitId, 5),
    getActiveServices(operatingUnitId),
    getActiveRewards(operatingUnitId),
  ]);

  return (
    <OperacaoCliente
      client={client}
      unitId={operatingUnitId}
      units={allowedUnits.map((u) => ({ id: u.id, name: u.name }))}
      canConfigure={profile.role !== "barbeiro"}
      balance={balance}
      transactions={transactions}
      services={services}
      rewards={rewards}
    />
  );
}
