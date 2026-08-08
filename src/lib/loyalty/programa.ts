import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { getAllUnits, getLoyaltyUnits, getUnitBySlug } from "@/lib/data";
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
  /**
   * **Todas** as unidades do site — é o que alimenta o seletor do cabeçalho,
   * que tem de continuar a levar a qualquer barbearia. Não confundir com
   * `loyaltyUnits`: uma unidade pode estar no site sem estar no programa.
   */
  units: UnitRow[];
  /** Só as que participam no cartão fidelidade, para a criação de conta. */
  loyaltyUnits: UnitRow[];
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
  const [units, loyaltyUnits, requested, { hasCard }] = await Promise.all([
    getAllUnits(),
    getLoyaltyUnits(),
    unidade ? getUnitBySlug(unidade) : Promise.resolve(null),
    getCardState(),
  ]);
  // Sem slug, mostra o programa da primeira unidade que participa — não faz
  // sentido abrir o programa numa barbearia que está fora dele.
  const unit = requested ?? loyaltyUnits[0] ?? units[0] ?? null;

  if (!sb || !unit) {
    return {
      unit,
      units,
      loyaltyUnits,
      hasCard,
      services: [],
      rewards: [],
      bonuses: null,
    };
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

  // RLS só devolve linhas activas: sem linha é desactivado — quem decide o
  // valor é o painel, não este ficheiro.
  const bonusList = (b.data ?? []) as {
    kind: LoyaltyBonusKind;
    points: number;
    active: boolean;
  }[];
  const findBonus = (kind: LoyaltyBonusKind) => bonusList.find((x) => x.kind === kind);

  return {
    unit,
    units,
    loyaltyUnits,
    hasCard,
    services: (s.data ?? []) as LoyaltyServiceRow[],
    rewards: (r.data ?? []) as LoyaltyRewardRow[],
    bonuses: {
      signup: {
        points: findBonus("signup")?.points ?? 10,
        active: findBonus("signup")?.active ?? false,
      },
      instagram: {
        points: findBonus("instagram")?.points ?? 15,
        active: findBonus("instagram")?.active ?? false,
      },
    },
  };
}
