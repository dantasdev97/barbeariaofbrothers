"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Gift, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/admin/form-bits";
import { PageHeader } from "@/components/admin/page-header";
import { staggerIndex } from "@/lib/motion";
import { saveLoyaltyBonuses } from "@/lib/loyalty/actions";
import type { LoyaltyBonusRow, UnitRow } from "@/types/database.types";

type UnitLite = Pick<UnitRow, "id" | "name" | "slug">;

type BonusState = {
  points: string;
  active: boolean;
};

type UnitBonusState = {
  signup: BonusState;
  instagram: BonusState;
};

function initialState(unitId: string, bonuses: LoyaltyBonusRow[]): UnitBonusState {
  const signup = bonuses.find((b) => b.unit_id === unitId && b.kind === "signup");
  const instagram = bonuses.find((b) => b.unit_id === unitId && b.kind === "instagram");
  return {
    signup: { points: String(signup?.points ?? 50), active: signup?.active ?? true },
    instagram: { points: String(instagram?.points ?? 30), active: instagram?.active ?? true },
  };
}

/**
 * Os bónus de registo e Instagram deixaram de estar fixos no código
 * (0008_editable_bonus_points.sql) — cada unidade tem a sua linha, editável
 * aqui. Sem lista/diálogo como serviços e recompensas: são só duas
 * quantidades fixas por unidade, um cartão por unidade chega.
 */
export function BonusManager({
  bonuses,
  units,
}: {
  bonuses: LoyaltyBonusRow[];
  units: UnitLite[];
}) {
  const router = useRouter();
  const [state, setState] = useState<Record<string, UnitBonusState>>(() =>
    Object.fromEntries(units.map((u) => [u.id, initialState(u.id, bonuses)])),
  );
  const [pendingUnit, setPendingUnit] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function update(unitId: string, kind: "signup" | "instagram", patch: Partial<BonusState>) {
    setState((prev) => ({
      ...prev,
      [unitId]: { ...prev[unitId], [kind]: { ...prev[unitId][kind], ...patch } },
    }));
  }

  function save(unitId: string) {
    const unitState = state[unitId];
    const signupPoints = Number(unitState.signup.points);
    const instagramPoints = Number(unitState.instagram.points);
    if (!Number.isInteger(signupPoints) || signupPoints <= 0) {
      return toast.error("Pontos de registo deve ser > 0.");
    }
    if (!Number.isInteger(instagramPoints) || instagramPoints <= 0) {
      return toast.error("Pontos de Instagram deve ser > 0.");
    }

    setPendingUnit(unitId);
    startTransition(async () => {
      try {
        await saveLoyaltyBonuses({
          unit_id: unitId,
          signup: { points: signupPoints, active: unitState.signup.active },
          instagram: { points: instagramPoints, active: unitState.instagram.active },
        });
        toast.success("Bónus guardados.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falhou.");
      } finally {
        setPendingUnit(null);
      }
    });
  }

  return (
    <div>
      <PageHeader
        title="Bónus de registo e Instagram"
        description="Pontos de boas-vindas ao criar conta e por seguir no Instagram — por unidade."
      />

      <div className="stagger grid grid-cols-1 gap-4 lg:grid-cols-2">
        {units.map((u, i) => {
          const unitState = state[u.id];
          const isPending = pendingUnit === u.id;
          return (
            <div
              key={u.id}
              {...staggerIndex(i)}
              className="overflow-hidden rounded-2xl border border-border bg-bg-surface"
            >
              <div className="border-b border-border px-6 py-[18px]">
                <div className="font-heading text-base font-semibold tracking-tight">
                  {u.name}
                </div>
              </div>

              <div className="space-y-4 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                      <Field id={`signup-${u.id}`} label="Bónus de registo">
                        <Input
                          id={`signup-${u.id}`}
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={unitState.signup.points}
                          onChange={(e) => update(u.id, "signup", { points: e.target.value })}
                        />
                      </Field>
                      <label className="flex h-10 items-center gap-2 text-[13px] text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={unitState.signup.active}
                          onChange={(e) => update(u.id, "signup", { active: e.target.checked })}
                          className="h-4 w-4 accent-[color:var(--color-brand,#C9A84C)]"
                        />
                        Activo
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Gift className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                      <Field id={`instagram-${u.id}`} label="Bónus de Instagram">
                        <Input
                          id={`instagram-${u.id}`}
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={unitState.instagram.points}
                          onChange={(e) => update(u.id, "instagram", { points: e.target.value })}
                        />
                      </Field>
                      <label className="flex h-10 items-center gap-2 text-[13px] text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={unitState.instagram.active}
                          onChange={(e) => update(u.id, "instagram", { active: e.target.checked })}
                          className="h-4 w-4 accent-[color:var(--color-brand,#C9A84C)]"
                        />
                        Activo
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    onClick={() => save(u.id)}
                    disabled={isPending}
                    className="bg-brand text-primary-foreground hover:bg-brand-hover"
                  >
                    {isPending ? "A guardar…" : "Guardar"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
