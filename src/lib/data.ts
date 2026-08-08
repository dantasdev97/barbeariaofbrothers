import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  BarberRow,
  ProductCategoryRow,
  ProductRow,
  UnitRow,
} from "@/types/database.types";

/**
 * Cached server-side data fetchers. All catalog reads are tagged so the admin
 * can invalidate via `updateTag('unit:<slug>')` after mutations.
 *
 * Uses the anonymous Supabase client (no cookies) to satisfy Cache Components'
 * rule against runtime APIs inside `'use cache'`. RLS limits to active rows.
 */

export async function getAllUnits(): Promise<UnitRow[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getAllUnits]", error);
    return [];
  }
  return (data ?? []) as UnitRow[];
}

/** Unidades do programa + se a lista é de confiança. Ver `getLoyaltyUnitsState`. */
export type LoyaltyUnitsState = {
  units: UnitRow[];
  /**
   * `false` quando a consulta por `loyalty_active` falhou e isto são **todas**
   * as unidades, não as do programa. Quem usa a lista para decidir sozinho
   * (criar cartão sem perguntar) tem de saber a diferença.
   */
  configured: boolean;
};

/**
 * Unidades que participam no cartão fidelidade, com o estado da consulta.
 *
 * Separada de `getAllUnits()` de propósito: essa é usada pelo site público
 * (homepage, layout da unidade, cartão) e filtrar lá dentro tirava a unidade do
 * site todo. Aqui só interessa quem está no programa de pontos.
 */
export async function getLoyaltyUnitsState(): Promise<LoyaltyUnitsState> {
  const supabase = createPublicClient();
  if (!supabase) return { units: [], configured: false };
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("active", true)
    .eq("loyalty_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    // Antes de a migração 0011 correr, a coluna `loyalty_active` não existe e
    // esta consulta falha. Devolver [] deixava o programa sem barbearia
    // nenhuma para escolher — pior do que oferecer todas. Cai para a lista
    // completa até a migração ser aplicada.
    //
    // O fallback fica, mas deixa de ser calado: devolvido às escondidas,
    // transformava uma migração em falta num ecrã de aspecto normal a pedir
    // a barbearia — e foi exactamente assim que o problema passou duas vezes
    // sem ninguém perceber que era configuração.
    console.error("[getLoyaltyUnits] a usar todas as unidades:", error.message);
    return { units: await getAllUnits(), configured: false };
  }
  return { units: (data ?? []) as UnitRow[], configured: true };
}

/** Só a lista, para quem não precisa de distinguir o fallback. */
export async function getLoyaltyUnits(): Promise<UnitRow[]> {
  return (await getLoyaltyUnitsState()).units;
}

export async function getUnitBySlug(slug: string): Promise<UnitRow | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("units")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  return (data ?? null) as UnitRow | null;
}

export async function getBarbersByUnit(unitId: string): Promise<BarberRow[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("barbers")
    .select("*")
    .eq("unit_id", unitId)
    .eq("active", true)
    .order("display_order", { ascending: true });

  return (data ?? []) as BarberRow[];
}

export async function getBarberBySlug(
  unitId: string,
  slug: string,
): Promise<BarberRow | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("barbers")
    .select("*")
    .eq("unit_id", unitId)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  return (data ?? null) as BarberRow | null;
}

export async function getProductsByUnit(unitId: string): Promise<ProductRow[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("unit_id", unitId)
    .eq("active", true)
    .order("name", { ascending: true });

  const rows = (data ?? []) as ProductRow[];
  // Featured first (stable on `name`). Done in JS so a missing `featured`
  // column never breaks the public catalog before the migration runs.
  return rows.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
}

export async function getProductBySlug(
  unitId: string,
  slug: string,
): Promise<ProductRow | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("unit_id", unitId)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  return (data ?? null) as ProductRow | null;
}

export async function getCategoriesByUnit(
  unitId: string,
): Promise<ProductCategoryRow[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("product_categories")
    .select("*")
    .eq("unit_id", unitId)
    .order("display_order", { ascending: true });

  return (data ?? []) as ProductCategoryRow[];
}
