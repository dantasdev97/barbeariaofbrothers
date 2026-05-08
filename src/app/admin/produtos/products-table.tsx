"use client";

import { useState, useTransition } from "react";
import { Package, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ProductRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteProduct } from "@/lib/admin-actions";
import { formatPrice } from "@/lib/utils";

type UnitLite = { id: string; name: string; slug: string };

export function ProductsTable({
  products,
  units,
  onEdit,
  onAdd,
}: {
  products: ProductRow[];
  units: UnitLite[];
  onEdit?: (p: ProductRow) => void;
  onAdd?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<ProductRow | null>(null);
  const unitsById = new Map(units.map((u) => [u.id, u]));

  function confirmDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      try {
        await deleteProduct(toDelete.id, toDelete.unit_id);
        toast.success("Produto eliminado.");
        setToDelete(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-bg-surface py-12 text-center sm:rounded-2xl sm:py-16">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-heading text-base font-semibold">Sem produtos ainda</p>
        <p className="mt-1 text-sm text-muted-foreground">Adicione o primeiro produto ao catálogo.</p>
        <Button
          className="mt-6 bg-brand text-primary-foreground hover:bg-brand-hover"
          onClick={onAdd}
        >
          Adicionar produto
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-bg-surface sm:rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left font-medium sm:px-5 sm:py-4">Produto</th>
                <th className="hidden px-3 py-3 text-left font-medium sm:table-cell sm:px-5 sm:py-4">Unidade</th>
                <th className="px-3 py-3 text-left font-medium sm:px-5 sm:py-4">Preço</th>
                <th className="px-3 py-3 text-left font-medium sm:px-5 sm:py-4">Estado</th>
                <th className="px-3 py-3 sm:px-5 sm:py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id} className="transition hover:bg-background">
                  <td className="px-3 py-3 font-medium sm:px-5 sm:py-4">{p.name}</td>
                  <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell sm:px-5 sm:py-4">
                    {unitsById.get(p.unit_id)?.name ?? "—"}
                  </td>
                  <td className="px-3 py-3 font-semibold text-brand sm:px-5 sm:py-4">
                    {formatPrice(p.price_cents)}
                  </td>
                  <td className="px-3 py-3 sm:px-5 sm:py-4">
                    <Badge
                      variant={p.active ? "default" : "secondary"}
                      className={p.active ? "bg-brand/15 text-brand" : ""}
                    >
                      {p.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right sm:px-5 sm:py-4">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit?.(p)}
                        className="h-8 px-2 sm:h-9 sm:px-3"
                      >
                        <Pencil className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="sr-only sm:not-sr-only">Editar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setToDelete(p)}
                        className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive sm:h-9 sm:px-3"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="sr-only sm:not-sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => { if (!open) setToDelete(null); }}
        title="Eliminar produto"
        description={`Tem a certeza que pretende eliminar "${toDelete?.name}"? Esta acção não pode ser revertida.`}
        onConfirm={confirmDelete}
        loading={pending}
      />
    </>
  );
}
