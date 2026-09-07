import { TZ } from "@/lib/date-range";
import type { LoyaltyBonusKind } from "@/types/database.types";

/**
 * Movimentos do cartão traduzidos para o que o cliente lê.
 *
 * Duas razões para isto viver aqui e não em cada página:
 *
 * 1. **O nome do serviço.** O cartão público mostrava "Corte + barba" e o
 *    `/minha-conta` mostrava "Serviço" em todas as linhas — a mesma visita,
 *    dois nomes, consoante a página. O `service_id` estava lá; faltava
 *    trocá-lo pelo nome.
 * 2. **As datas.** Formatadas no fuso de Lisboa e no servidor. No cliente,
 *    o `toLocaleDateString` corria no browser depois de o servidor já ter
 *    escrito outra coisa (o servidor corre em UTC): dava aviso de
 *    hidratação e, perto da meia-noite, o dia errado.
 */

const monthFmt = new Intl.DateTimeFormat("pt-PT", {
  timeZone: TZ,
  month: "long",
  year: "numeric",
});
const dayFmt = new Intl.DateTimeFormat("pt-PT", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
});
const timeFmt = new Intl.DateTimeFormat("pt-PT", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});
const fullFmt = new Intl.DateTimeFormat("pt-PT", {
  timeZone: TZ,
  dateStyle: "long",
  timeStyle: "short",
});
/** "2026-09" no fuso de Lisboa — chave de agrupamento por mês. */
const monthKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
});

export type HistoryKind = "earn" | "redeem" | "bonus" | "adjust";

export type HistoryEntry = {
  id: string;
  kind: HistoryKind;
  points: number;
  /** O que aconteceu: "Corte + barba", "Corte grátis", "Seguiu no Instagram". */
  label: string;
  unitName: string | null;
  /** "2026-09" */
  monthKey: string;
  /** "Setembro 2026" */
  monthLabel: string;
  /** "05 set" */
  dayLabel: string;
  /** "14:32" */
  timeLabel: string;
  /** Data por extenso, para o `title`. */
  fullDate: string;
};

const BONUS_LABEL: Record<string, string> = {
  signup: "Bónus de boas-vindas",
  instagram: "Seguiu no Instagram",
};

type TxLike = {
  id: string;
  type: string;
  points: number;
  service_id: string | null;
  reward_id: string | null;
  bonus_kind: LoyaltyBonusKind | null;
  note: string | null;
  unit_id: string;
  created_at: string;
};

function titleCase(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

export function buildHistory(
  txs: TxLike[],
  lookups: {
    services: Map<string, string>;
    rewards: Map<string, string>;
    units: Map<string, string>;
  },
): HistoryEntry[] {
  return txs.map((t) => {
    const at = new Date(t.created_at);
    const kind = (["earn", "redeem", "bonus", "adjust"] as const).includes(
      t.type as HistoryKind,
    )
      ? (t.type as HistoryKind)
      : "adjust";

    let label: string;
    if (kind === "earn") {
      label =
        (t.service_id ? lookups.services.get(t.service_id) : null) ??
        t.note ??
        "Serviço";
    } else if (kind === "redeem") {
      label =
        (t.reward_id ? lookups.rewards.get(t.reward_id) : null) ??
        t.note ??
        "Recompensa";
    } else if (kind === "bonus") {
      label =
        (t.bonus_kind ? BONUS_LABEL[t.bonus_kind] : null) ?? t.note ?? "Bónus";
    } else {
      label = t.note ?? "Ajuste";
    }

    // "setembro de 2026" → "Setembro 2026": é um cabeçalho, não uma frase.
    const monthLabel = titleCase(monthFmt.format(at).replace(" de ", " "));

    return {
      id: t.id,
      kind,
      points: t.points,
      label,
      unitName: lookups.units.get(t.unit_id) ?? null,
      monthKey: monthKeyFmt.format(at),
      monthLabel,
      dayLabel: dayFmt.format(at),
      timeLabel: timeFmt.format(at),
      fullDate: fullFmt.format(at),
    };
  });
}

export type CardStats = {
  /** Visitas com pontos lançados ao balcão. */
  visits: number;
  /** Tudo o que entrou no cartão, incluindo bónus. */
  pointsEarned: number;
  /** Recompensas trocadas. */
  redeemed: number;
};

/**
 * Números do cartão, a partir do histórico completo.
 *
 * Contados aqui e não na base porque a página já lê os movimentos todos para
 * o histórico — uma segunda ida ao servidor para somar o que já está na mão
 * não se justifica.
 */
export function buildStats(entries: HistoryEntry[]): CardStats {
  let visits = 0;
  let pointsEarned = 0;
  let redeemed = 0;
  for (const e of entries) {
    if (e.kind === "earn") visits += 1;
    if (e.kind === "redeem") redeemed += 1;
    if (e.points > 0) pointsEarned += e.points;
  }
  return { visits, pointsEarned, redeemed };
}
