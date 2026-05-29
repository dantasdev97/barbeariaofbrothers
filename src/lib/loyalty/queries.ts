import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ClientRow,
  LoyaltyRewardRow,
  LoyaltyServiceRow,
  LoyaltyTransactionRow,
} from "@/types/database.types";

/**
 * Saldo do cliente numa unidade específica.
 */
export async function getClientBalance(clientId: string, unitId: string): Promise<number> {
  const sb = createAdminClient();
  const { data } = await sb
    .from("client_unit_balances")
    .select("balance")
    .eq("client_id", clientId)
    .eq("unit_id", unitId)
    .maybeSingle();
  return data?.balance ?? 0;
}

/**
 * Saldo de um cliente em todas as unidades (cliente é global, saldos são por unidade).
 */
export async function getClientBalancesAllUnits(clientId: string) {
  const sb = createAdminClient();
  const { data } = await sb
    .from("client_unit_balances")
    .select("unit_id, balance")
    .eq("client_id", clientId);
  return (data ?? []) as Array<{ unit_id: string; balance: number }>;
}

/**
 * Lookup por handle: aceita public_slug (`augusto-dantas-J2VV`) ou qr_token
 * (`J2VVQ5PZY3QSXH7V-Z46T`). Diferenciamos pelo formato: slug tem letras
 * minúsculas; qr_token é só maiúsculas/dígitos.
 */
export async function getClientByHandle(handle: string): Promise<ClientRow | null> {
  const sb = createAdminClient();
  const isToken = /^[A-Z0-9-]+$/.test(handle);
  const { data } = await sb
    .from("clients")
    .select("*")
    .eq(isToken ? "qr_token" : "public_slug", handle)
    .maybeSingle();
  return (data as ClientRow) ?? null;
}

/** @deprecated use getClientByHandle */
export const getClientByToken = getClientByHandle;

export async function getClientById(id: string): Promise<ClientRow | null> {
  const sb = createAdminClient();
  const { data } = await sb.from("clients").select("*").eq("id", id).maybeSingle();
  return (data as ClientRow) ?? null;
}

export async function getRecentTransactions(
  clientId: string,
  unitId?: string,
  limit = 5,
): Promise<LoyaltyTransactionRow[]> {
  const sb = createAdminClient();
  let q = sb
    .from("loyalty_transactions")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (unitId) q = q.eq("unit_id", unitId);
  const { data } = await q;
  return (data as LoyaltyTransactionRow[]) ?? [];
}

export async function getActiveServices(unitId: string): Promise<LoyaltyServiceRow[]> {
  const sb = createAdminClient();
  const { data } = await sb
    .from("loyalty_services")
    .select("*")
    .eq("unit_id", unitId)
    .eq("active", true)
    .order("display_order");
  return (data as LoyaltyServiceRow[]) ?? [];
}

export async function getActiveRewards(unitId: string): Promise<LoyaltyRewardRow[]> {
  const sb = createAdminClient();
  const { data } = await sb
    .from("loyalty_rewards")
    .select("*")
    .eq("unit_id", unitId)
    .eq("active", true)
    .order("points_cost");
  return (data as LoyaltyRewardRow[]) ?? [];
}
