"use client";

import { useState, useTransition } from "react";
import { KeyRound, Pencil, Scissors, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { BarberRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { staggerIndex } from "@/lib/motion";
import { deleteBarber } from "@/lib/admin-actions";

type UnitLite = { id: string; name: string; slug: string };

export function BarbersTable({
  barbers,
  units,
  onEdit,
  onAdd,
  onCreateAccess,
}: {
  barbers: BarberRow[];
  units: UnitLite[];
  onEdit?: (b: BarberRow) => void;
  onAdd?: () => void;
  onCreateAccess?: (b: BarberRow) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<BarberRow | null>(null);
  const unitsById = new Map(units.map((u) => [u.id, u]));

  function confirmDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      try {
        await deleteBarber(toDelete.id, toDelete.unit_id);
        toast.success("Barbeiro eliminado.");
        setToDelete(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  if (barbers.length === 0) {
    return (
      <EmptyState
        icon={<Scissors className="h-6 w-6" />}
        title="Sem barbeiros ainda"
        description="Adicione o primeiro barbeiro para começar."
        action={
          <Button
            className="bg-brand text-primary-foreground hover:bg-brand-hover"
            onClick={onAdd}
          >
            Adicionar barbeiro
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="stagger space-y-3 md:hidden">
        {barbers.map((b, i) => (
          <article
            key={b.id}
            {...staggerIndex(i)}
            className="rounded-xl border border-border bg-bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-heading text-lg font-semibold">
                  {b.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {unitsById.get(b.unit_id)?.name ?? "-"}
                </p>
              </div>
              <Badge
                variant={b.active ? "default" : "secondary"}
                className={b.active ? "shrink-0 bg-brand/15 text-brand" : "shrink-0"}
              >
                {b.active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {b.speciality ?? "Sem especialidade definida"}
            </p>
            {b.auth_user_id ? (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-brand/10 px-2 py-1 text-xs font-medium text-brand">
                <ShieldCheck className="h-3.5 w-3.5" /> Acesso criado
              </p>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => onCreateAccess?.(b)}
              >
                <KeyRound className="mr-1 h-3.5 w-3.5" /> Criar acesso (login)
              </Button>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" onClick={() => onEdit?.(b)}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setToDelete(b)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Eliminar
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border bg-bg-surface md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-4 text-left font-medium">Nome</th>
              <th className="px-5 py-4 text-left font-medium">Unidade</th>
              <th className="hidden px-5 py-4 text-left font-medium sm:table-cell">Especialidade</th>
              <th className="px-5 py-4 text-left font-medium">Estado</th>
              <th className="px-5 py-4 text-left font-medium">Acesso</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="stagger divide-y divide-border">
            {barbers.map((b, i) => (
              <tr
                key={b.id}
                {...staggerIndex(i)}
                className="transition-colors duration-150 hover-fine:hover:bg-background"
              >
                <td className="px-5 py-4 font-medium">{b.name}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {unitsById.get(b.unit_id)?.name ?? "—"}
                </td>
                <td className="hidden px-5 py-4 text-muted-foreground sm:table-cell">
                  {b.speciality ?? "—"}
                </td>
                <td className="px-5 py-4">
                  <Badge
                    variant={b.active ? "default" : "secondary"}
                    className={b.active ? "bg-brand/15 text-brand" : ""}
                  >
                    {b.active ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  {b.auth_user_id ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
                      <ShieldCheck className="h-3.5 w-3.5" /> Com login
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onCreateAccess?.(b)}
                    >
                      <KeyRound className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Criar acesso</span>
                    </Button>
                  )}
                </td>
                <td className="px-3 py-4 text-right sm:px-5">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit?.(b)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setToDelete(b)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => { if (!open) setToDelete(null); }}
        title="Eliminar barbeiro"
        description={`Tem a certeza que pretende eliminar "${toDelete?.name}"? Esta acção não pode ser revertida.`}
        onConfirm={confirmDelete}
        loading={pending}
      />
    </>
  );
}
