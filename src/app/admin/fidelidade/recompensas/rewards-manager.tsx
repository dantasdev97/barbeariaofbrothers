"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
  const [pending, startTransition] = useTransition();

  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("100");
  const [active, setActive] = useState(true);

  function openNew() {
    setEditing(null);
    setUnitId(units[0]?.id ?? "");
    setName("");
    setDescription("");
    setCost("100");
    setActive(true);
    setOpen(true);
  }

  function openEdit(r: LoyaltyRewardRow) {
    setEditing(r);
    setUnitId(r.unit_id);
    setName(r.name);
    setDescription(r.description ?? "");
    setCost(String(r.points_cost));
    setActive(r.active);
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Indique o nome.");
    const c = Number(cost);
    if (!Number.isInteger(c) || c <= 0) return toast.error("Custo deve ser > 0.");

    startTransition(async () => {
      try {
        await saveLoyaltyReward({
          id: editing?.id,
          unit_id: unitId,
          name,
          description,
          points_cost: c,
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

  function remove(id: string) {
    if (!confirm("Eliminar recompensa?")) return;
    startTransition(async () => {
      try {
        await deleteLoyaltyReward(id);
        toast.success("Eliminada.");
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
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            Sem recompensas.
          </p>
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
                {r.name}
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
                      ? "bg-green-500/10 text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.active ? "Activa" : "Inactiva"}
                </span>
              </div>
              <button
                onClick={() => remove(r.id)}
                className="text-muted-foreground hover:text-red-400"
                aria-label="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

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
