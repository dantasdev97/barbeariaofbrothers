"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  deleteLoyaltyService,
  saveLoyaltyService,
} from "@/lib/loyalty/actions";
import type { LoyaltyServiceRow, UnitRow } from "@/types/database.types";

type UnitLite = Pick<UnitRow, "id" | "name" | "slug">;

export function ServicesManager({
  services,
  units,
}: {
  services: LoyaltyServiceRow[];
  units: UnitLite[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LoyaltyServiceRow | null>(null);
  const [pending, startTransition] = useTransition();

  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [name, setName] = useState("");
  const [points, setPoints] = useState("10");
  const [order, setOrder] = useState("0");
  const [active, setActive] = useState(true);

  function openNew() {
    setEditing(null);
    setUnitId(units[0]?.id ?? "");
    setName("");
    setPoints("10");
    setOrder("0");
    setActive(true);
    setOpen(true);
  }

  function openEdit(s: LoyaltyServiceRow) {
    setEditing(s);
    setUnitId(s.unit_id);
    setName(s.name);
    setPoints(String(s.points_value));
    setOrder(String(s.display_order));
    setActive(s.active);
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Indique o nome.");
    const p = Number(points);
    if (!Number.isInteger(p) || p <= 0) return toast.error("Pontos deve ser > 0.");

    startTransition(async () => {
      try {
        await saveLoyaltyService({
          id: editing?.id,
          unit_id: unitId,
          name,
          points_value: p,
          display_order: Number(order) || 0,
          active,
        });
        toast.success("Serviço guardado.");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falhou.");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Eliminar serviço?")) return;
    startTransition(async () => {
      try {
        await deleteLoyaltyService(id);
        toast.success("Eliminado.");
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
        title="Serviços pontuáveis"
        description="Configura quantos pontos cada serviço atribui — por unidade."
        actions={
          <Button
            onClick={openNew}
            className="bg-brand text-primary-foreground hover:bg-brand-hover"
          >
            <Plus className="mr-2 h-4 w-4" /> Novo serviço
          </Button>
        }
      />

      <div className="stagger overflow-hidden rounded-2xl border border-border bg-bg-surface">
        <div className="hidden gap-3 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:grid md:grid-cols-[2fr_1.4fr_1fr_0.7fr_auto]">
          <div>Nome</div>
          <div>Unidade</div>
          <div>Pontos</div>
          <div>Estado</div>
          <div></div>
        </div>
        {services.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            Sem serviços.
          </p>
        ) : (
          services.map((s, i) => (
            <div
              key={s.id}
              {...staggerIndex(i)}
              className="grid gap-2 border-t border-border px-4 py-3 text-sm transition-colors duration-150 hover-fine:hover:bg-background sm:px-6 md:grid-cols-[2fr_1.4fr_1fr_0.7fr_auto] md:items-center md:gap-3"
            >
              <button
                onClick={() => openEdit(s)}
                className="text-left font-medium transition-colors duration-150 hover:text-brand"
              >
                {s.name}
              </button>
              <div className="text-[13px] text-muted-foreground">
                {unitName(s.unit_id)}
              </div>
              <div className="font-mono text-[13px] text-brand">
                +{s.points_value} pts
              </div>
              <div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    s.active
                      ? "bg-green-500/10 text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <button
                onClick={() => remove(s.id)}
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
            <DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <Field id="svc-unit" label="Unidade *">
              <select
                id="svc-unit"
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
            <Field id="svc-name" label="Nome *">
              <Input
                id="svc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Corte clássico"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="svc-points" label="Pontos *">
                <Input
                  id="svc-points"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                />
              </Field>
              <Field id="svc-order" label="Ordem">
                <Input
                  id="svc-order"
                  type="number"
                  min="0"
                  step="1"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 accent-[color:var(--color-brand,#C9A84C)]"
              />
              Activo
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
