import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/admin-auth";
import { getLoyaltyUnits } from "@/lib/data";
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

  const allUnits = await getLoyaltyUnits();

  // Unidades em que este utilizador pode lançar pontos.
  //
  // O RPC `loyalty_earn` recusa qualquer unidade diferente do `profiles.unit_id`
  // de quem não é super_admin (0004_loyalty.sql). Restringir a lista ao que o
  // RPC aceita evita oferecer uma opção que ia falhar ao ser tocada.
  const allowedUnits =
    profile.role === "super_admin" || !profile.unit_id
      ? allUnits
      : allUnits.filter((u) => u.id === profile.unit_id);

  // Nenhuma unidade elegível: o perfil está atribuído a uma casa que ficou fora
  // do programa de pontos (units.loyalty_active = false). Dizê-lo é melhor que
  // mostrar um cartão que não deixa lançar nada.
  if (allowedUnits.length === 0) {
    return <OperacaoSemUnidade clientName={client.name} />;
  }

  // Unidade de operação: escolha explícita (?unidade=) → unidade do perfil →
  // unidade de cadastro do cliente. Tudo validado contra `allowedUnits`, para
  // que nem um id colado no URL nem uma unidade fora do programa passem.
  const inScope = (id: string | null) =>
    !!id && allowedUnits.some((u) => u.id === id);
  const operatingUnitId =
    [unidade ?? null, profile.unit_id, client.unit_id].find(inScope) ??
    allowedUnits[0].id;

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

function OperacaoSemUnidade({ clientName }: { clientName: string }) {
  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/admin/operacao"
        className="mb-4 -ml-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm text-muted-foreground transition-colors duration-150 hover-fine:hover:text-foreground"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Operação
      </Link>
      <div className="rounded-2xl border border-dashed border-border bg-bg-surface px-6 py-12 text-center">
        <h1 className="font-heading text-[20px] font-semibold tracking-tight">
          Unidade fora do programa
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A sua unidade não participa no cartão fidelidade, por isso não é
          possível lançar pontos a {clientName}. Quem gere o painel pode activá-la
          em Fidelidade → Bónus.
        </p>
      </div>
    </div>
  );
}
