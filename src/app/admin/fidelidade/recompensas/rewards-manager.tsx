"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Gift, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/admin/form-bits";
import { PageHeader } from "@/components/admin/page-header";
import { staggerIndex } from "@/lib/motion";
import { REWARD_KINDS, formatRewardValue, rewardKindLabel } from "@/lib/loyalty/rewards";
import type { LoyaltyRewardKind } from "@/types/database.types";
import { EmptyState } from "@/components/admin/empty-state";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DeleteAction, RowActions } from "@/components/admin/row-actions";
import {
  deleteLoyaltyReward,
  saveLoyaltyReward,
} from "@/lib/loyalty/actions";
import type { LoyaltyRewardRow, UnitRow } from "@/types/database.types";

type UnitLite = Pick<UnitRow, "id" | "name" | "slug">;

export function RewardsManager({
  rewards,
  units,
}: {
  rewards: LoyaltyRewardRow[];
  units: UnitLite[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LoyaltyRewardRow | null>(null);
  const [toDelete, setToDelete] = useState<LoyaltyRewardRow | null>(null);
  const [pending, startTransition] = useTransition();

  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("100");
  const [kind, setKind] = useState<LoyaltyRewardKind>("service");
  const [amount, setAmount] = useState("");
  const [percent, setPercent] = useState("");
  const [active, setActive] = useState(true);

  function openNew() {
    setEditing(null);
    setUnitId(units[0]?.id ?? "");
    setName("");
    setDescription("");
    setCost("100");
    setKind("service");
    setAmount("");
    setPercent("");
    setActive(true);
    setOpen(true);
  }

  function openEdit(r: LoyaltyRewardRow) {
    setEditing(r);
    setUnitId(r.unit_id);
    setName(r.name);
    setDescription(r.description ?? "");
    setCost(String(r.points_cost));
    setKind(r.kind);
    setAmount(r.value_cents != null ? String(r.value_cents / 100) : "");
    setPercent(r.percent != null ? String(r.percent) : "");
    setActive(r.active);
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Indique o nome.");
    const c = Number(cost);
    if (!Number.isInteger(c) || c <= 0) return toast.error("Custo deve ser > 0.");

    // Cada tipo exige o seu campo — a base tem o mesmo check, mas avisar
    // aqui poupa uma ida ao servidor para dar um erro que já se sabe.
    const valueCents = kind === "amount" ? Math.round(Number(amount) * 100) : null;
    const percentValue = kind === "percent" ? Number(percent) : null;
    if (kind === "amount" && (!valueCents || valueCents <= 0)) {
      return toast.error("Indique o valor em euros.");
    }
    if (kind === "percent" && (!percentValue || percentValue < 1 || percentValue > 100)) {
      return toast.error("A percentagem tem de estar entre 1 e 100.");
    }

    startTransition(async () => {
      try {
        await saveLoyaltyReward({
          id: editing?.id,
          unit_id: unitId,
          name,
          description,
          points_cost: c,
          kind,
          value_cents: valueCents,
          percent: percentValue,
          active,
        });
        toast.success("Recompensa guardada.");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falhou.");
      }
    });
  }

  function confirmRemove() {
    if (!toDelete) return;
    startTransition(async () => {
      try {
        await deleteLoyaltyReward(toDelete.id);
        toast.success("Eliminada.");
        setToDelete(null);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falhou.");
      }
    });
  }

  const unitName = (id: string) => units.find((u) => u.id === id)?.name ?? "—";

  return (
    <div>
      <PageHeader
        title="Recompensas"
        description="Define o que o cliente pode resgatar com os pontos — por unidade."
        actions={
          <Button
            onClick={openNew}
            className="bg-brand text-primary-foreground hover:bg-brand-hover"
          >
            <Plus className="mr-2 h-4 w-4" /> Nova recompensa
          </Button>
        }
      />

      <div className="stagger overflow-hidden rounded-2xl border border-border bg-bg-surface">
        <div className="hidden gap-3 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:grid md:grid-cols-[2fr_1.4fr_1fr_0.7fr_auto]">
          <div>Nome</div>
          <div>Unidade</div>
          <div>Custo</div>
          <div>Estado</div>
          <div></div>
        </div>
        {rewards.length === 0 ? (
          <EmptyState
            className="border-0"
            icon={<Gift className="h-6 w-6" />}
            title="Sem recompensas"
            description="Crie a primeira recompensa para os clientes trocarem pontos."
            action={
              <Button
                onClick={openNew}
                className="bg-brand text-primary-foreground hover:bg-brand-hover"
              >
                <Plus className="mr-2 h-4 w-4" /> Nova recompensa
              </Button>
            }
          />
        ) : (
          rewards.map((r, i) => (
            <div
              key={r.id}
              {...staggerIndex(i)}
              className="grid gap-2 border-t border-border px-4 py-3 text-sm transition-colors duration-150 hover-fine:hover:bg-background sm:px-6 md:grid-cols-[2fr_1.4fr_1fr_0.7fr_auto] md:items-center md:gap-3"
            >
              <button
                onClick={() => openEdit(r)}
                className="text-left font-medium transition-colors duration-150 hover:text-brand"
              >
                <span className="flex flex-wrap items-center gap-2">
                  {r.name}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {rewardKindLabel(r.kind)}
                  </span>
                  {formatRewardValue(r.kind, r.value_cents, r.percent) && (
                    <span className="font-mono text-[12px] font-semibold text-brand">
                      {formatRewardValue(r.kind, r.value_cents, r.percent)}
                    </span>
                  )}
                </span>
                {r.description && (
                  <div className="text-[11px] font-normal text-muted-foreground">
                    {r.description}
                  </div>
                )}
              </button>
              <div className="text-[13px] text-muted-foreground">
                {unitName(r.unit_id)}
              </div>
              <div className="font-mono text-[13px] text-brand">{r.points_cost} pts</div>
              <div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    r.active
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.active ? "Activa" : "Inactiva"}
                </span>
              </div>
              <RowActions>
                <DeleteAction onClick={() => setToDelete(r)} label={r.name} />
              </RowActions>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => { if (!o) setToDelete(null); }}
        title="Eliminar recompensa"
        description={`Eliminar "${toDelete?.name}"? Os resgates já feitos mantêm-se no histórico.`}
        onConfirm={confirmRemove}
        loading={pending}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar recompensa" : "Nova recompensa"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <Field id="rw-unit" label="Unidade *">
              <select
                id="rw-unit"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="rw-kind" label="Tipo de recompensa *">
              <div className="grid grid-cols-2 gap-2">
                {REWARD_KINDS.map((k) => {
                  const Icon = k.icon;
                  const on = kind === k.value;
                  return (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => setKind(k.value)}
                      aria-pressed={on}
                      className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-left text-[13px] font-medium transition-[border-color,background-color,transform] duration-150 ease-out-strong active:scale-[0.98] ${
                        on
                          ? "border-brand bg-brand/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover-fine:hover:border-brand/40"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${on ? "text-brand" : ""}`} />
                      {k.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                {REWARD_KINDS.find((k) => k.value === kind)?.hint}
              </p>
            </Field>

            {kind === "amount" && (
              <Field id="rw-amount" label="Valor do desconto (€) *">
                <Input
                  id="rw-amount"
                  type="number"
                  min="1"
                  step="0.5"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="ex: 15"
                />
              </Field>
            )}

            {kind === "percent" && (
              <Field id="rw-percent" label="Percentagem de desconto (%) *">
                <Input
                  id="rw-percent"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  inputMode="numeric"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  placeholder="ex: 10"
                />
              </Field>
            )}

            <Field id="rw-name" label="Nome *">
              <Input
                id="rw-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Cera grátis"
              />
            </Field>
            <Field id="rw-desc" label="Descrição (opcional)">
              <Textarea
                id="rw-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ex: Aplicação no final do serviço"
              />
            </Field>
            <Field id="rw-cost" label="Custo em pontos *">
              <Input
                id="rw-cost"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 accent-[color:var(--color-brand,#C9A84C)]"
              />
              Activa
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="bg-brand text-primary-foreground hover:bg-brand-hover"
              >
                {pending ? "A guardar…" : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
