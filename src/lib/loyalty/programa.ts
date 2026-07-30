import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { getAllUnits, getUnitBySlug } from "@/lib/data";
import { getCardState } from "@/lib/loyalty/session";
import type { EarnListBonuses } from "@/components/cliente/earn-list";
import type {
  LoyaltyBonusKind,
  LoyaltyRewardRow,
  LoyaltyServiceRow,
  UnitRow,
} from "@/types/database.types";

/**
 * Contexto partilhado por `/programa` e pelas suas duas subpáginas.
 *
 * As três precisam exactamente do mesmo: resolver a unidade a partir do
 * `?unidade=`, saber se quem está a ver já tem cartão, e ter à mão as
 * listas daquela unidade. Ficava o mesmo bloco copiado três vezes.
 */
export type ProgramaContext = {
  unit: UnitRow | null;
  units: UnitRow[];
  hasCard: boolean;
  services: LoyaltyServiceRow[];
  rewards: LoyaltyRewardRow[];
  bonuses: EarnListBonuses | null;
};

export async function getProgramaContext(
  unidade?: string,
): Promise<ProgramaContext> {
  const sb = createPublicClient();

  // O botão fixo e o ícone do cabeçalho são por unidade e passam o slug:
  // quem vem do Vale de Lobos tem de ver o que é do Vale de Lobos.
  const [units, requested, { hasCard }] = await Promise.all([
    getAllUnits(),
    unidade ? getUnitBySlug(unidade) : Promise.resolve(null),
    getCardState(),
  ]);
  const unit = requested ?? units[0] ?? null;

  if (!sb || !unit) {
    return { unit, units, hasCard, services: [], rewards: [], bonuses: null };
  }

  const [s, r, b] = await Promise.all([
    sb
      .from("loyalty_services")
      .select("*")
      .eq("unit_id", unit.id)
      .eq("active", true)
      .order("display_order"),
    sb
      .from("loyalty_rewards")
      .select("*")
      .eq("unit_id", unit.id)
      .eq("active", true)
      .order("points_cost"),
    sb.from("loyalty_bonuses").select("kind, points, active").eq("unit_id", unit.id),
  ]);

  // RLS só devolve linhas activas: sem linha é desactivado, nunca 50/30
  // por omissão — quem decide o valor é o painel, não este ficheiro.
  const bonusList = (b.data ?? []) as {
    kind: LoyaltyBonusKind;
    points: number;
    active: boolean;
  }[];
  const findBonus = (kind: LoyaltyBonusKind) => bonusList.find((x) => x.kind === kind);

  return {
    unit,
    units,
    hasCard,
    services: (s.data ?? []) as LoyaltyServiceRow[],
    rewards: (r.data ?? []) as LoyaltyRewardRow[],
    bonuses: {
      signup: {
        points: findBonus("signup")?.points ?? 50,
        active: findBonus("signup")?.active ?? false,
      },
      instagram: {
        points: findBonus("instagram")?.points ?? 30,
        active: findBonus("instagram")?.active ?? false,
      },
    },
  };
}
