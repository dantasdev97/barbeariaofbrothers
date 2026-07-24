"use client";

import { useState, useTransition } from "react";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { UnitRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { staggerIndex } from "@/lib/motion";
import { deleteUnit } from "@/lib/admin-actions";

export function UnitsTable({
  units,
  onEdit,
  onAdd,
}: {
  units: UnitRow[];
  onEdit?: (u: UnitRow) => void;
  onAdd?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<UnitRow | null>(null);

  function confirmDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      try {
        await deleteUnit(toDelete.id, toDelete.slug);
        toast.success("Unidade eliminada.");
        setToDelete(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  if (units.length === 0) {
    return (
      <EmptyState
        icon={<MapPin className="h-6 w-6" />}
        title="Sem unidades ainda"
        description="Crie a primeira unidade para começar."
        action={
          <Button
            className="bg-brand text-primary-foreground hover:bg-brand-hover"
            onClick={onAdd}
          >
            Criar unidade
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="stagger space-y-3 md:hidden">
        {units.map((u, i) => (
          <article
            key={u.id}
            {...staggerIndex(i)}
            className="rounded-xl border border-border bg-bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-heading text-lg font-semibold">
                  {u.name}
                </h2>
                <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                  /{u.slug}
                </p>
              </div>
              <Badge
                variant={u.active ? "default" : "secondary"}
                className={u.active ? "shrink-0 bg-brand/15 text-brand" : "shrink-0"}
              >
                {u.active ? "Activa" : "Inactiva"}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" onClick={() => onEdit?.(u)}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setToDelete(u)}
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
              <th className="hidden px-5 py-4 text-left font-medium sm:table-cell">Slug</th>
              <th className="px-5 py-4 text-left font-medium">Estado</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="stagger divide-y divide-border">
            {units.map((u, i) => (
              <tr
                key={u.id}
                {...staggerIndex(i)}
                className="transition-colors duration-150 hover-fine:hover:bg-background"
              >
                <td className="px-5 py-4 font-medium">{u.name}</td>
                <td className="hidden px-5 py-4 sm:table-cell">
                  <code className="rounded-md bg-background px-2 py-1 font-mono text-xs text-muted-foreground">
                    /{u.slug}
                  </code>
                </td>
                <td className="px-5 py-4">
                  <Badge
                    variant={u.active ? "default" : "secondary"}
                    className={u.active ? "bg-brand/15 text-brand" : ""}
                  >
                    {u.active ? "Activa" : "Inactiva"}
                  </Badge>
                </td>
                <td className="px-3 py-4 text-right sm:px-5">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit?.(u)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setToDelete(u)}
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
        title="Eliminar unidade"
        description={`Tem a certeza que pretende eliminar a unidade "${toDelete?.name}"? Todos os barbeiros e produtos associados serão também removidos. Esta acção é irreversível.`}
        onConfirm={confirmDelete}
        loading={pending}
      />
    </>
  );
}
