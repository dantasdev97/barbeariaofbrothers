import { Gift, Percent, Scissors, Ticket, type LucideIcon } from "lucide-react";
import type { LoyaltyRewardKind } from "@/types/database.types";

/**
 * Apresentação dos tipos de recompensa.
 *
 * Os quatro tipos vieram do que o dono descreveu: valor fixo ("resgate 10
 * euros... ou 15, que é o valor dum corte degradê"), percentagem ("10% de
 * desconto"), serviço ("uma sobrancelha, uma depilação de nariz") e brinde
 * ("o cara consegue comprar o boné").
 *
 * Fica tudo num sítio para o cartão do cliente, o painel e o email dizerem
 * exactamente a mesma coisa.
 */

export const REWARD_KINDS: Array<{
  value: LoyaltyRewardKind;
  label: string;
  hint: string;
  icon: LucideIcon;
}> = [
  {
    value: "service",
    label: "Serviço",
    hint: "Um serviço do menu — corte, sobrancelha, depilação de nariz.",
    icon: Scissors,
  },
  {
    value: "amount",
    label: "Valor fixo",
    hint: "Desconto de um valor em euros. Ex.: 15 € para um corte degradê.",
    icon: Ticket,
  },
  {
    value: "percent",
    label: "Percentagem",
    hint: "Desconto proporcional sobre o serviço. Ex.: 10 %.",
    icon: Percent,
  },
  {
    value: "gift",
    label: "Brinde",
    hint: "Um produto da marca — boné, t-shirt.",
    icon: Gift,
  },
];

export function rewardKindLabel(kind: LoyaltyRewardKind): string {
  return REWARD_KINDS.find((k) => k.value === kind)?.label ?? "Serviço";
}

export function rewardKindIcon(kind: LoyaltyRewardKind): LucideIcon {
  return REWARD_KINDS.find((k) => k.value === kind)?.icon ?? Scissors;
}

/**
 * O valor concreto da recompensa, quando existe.
 *
 * Devolve `null` para serviço e brinde: nesses casos o nome ("Corte grátis",
 * "Boné Of Brothers") já diz tudo e repetir o tipo ao lado seria ruído.
 */
export function formatRewardValue(
  kind: LoyaltyRewardKind,
  valueCents: number | null,
  percent: number | null,
): string | null {
  if (kind === "amount" && valueCents != null) {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      // 10 € em vez de 10,00 € — valores redondos são a regra aqui.
      minimumFractionDigits: valueCents % 100 === 0 ? 0 : 2,
    }).format(valueCents / 100);
  }
  if (kind === "percent" && percent != null) return `${percent}%`;
  return null;
}
