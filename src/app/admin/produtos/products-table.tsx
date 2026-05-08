"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
}: {
  products: ProductRow[];
  units: UnitLite[];
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-bg-surface py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-heading text-base font-semibold">Sem produtos ainda</p>
        <p className="mt-1 text-sm text-muted-foreground">Adicione o primeiro produto ao catálogo.</p>
        <Button asChild className="mt-6 bg-brand text-primary-foreground hover:bg-brand-hover">
          <Link href="/admin/produtos/novo">Adicionar produto</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-4 text-left font-medium">Produto</th>
              <th className="hidden px-5 py-4 text-left font-medium sm:table-cell">Unidade</th>
              <th className="px-5 py-4 text-left font-medium">Preço</th>
              <th className="px-5 py-4 text-left font-medium">Estado</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id} className="transition hover:bg-background">
                <td className="px-5 py-4 font-medium">{p.name}</td>
                <td className="hidden px-5 py-4 text-muted-foreground sm:table-cell">
                  {unitsById.get(p.unit_id)?.name ?? "—"}
                </td>
                <td className="px-5 py-4 font-semibold text-brand">
                  {formatPrice(p.price_cents)}
                </td>
                <td className="px-5 py-4">
                  <Badge
                    variant={p.active ? "default" : "secondary"}
                    className={p.active ? "bg-brand/15 text-brand" : ""}
                  >
                    {p.active ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/produtos/${p.id}`}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setToDelete(p)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Eliminar
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
        title="Eliminar produto"
        description={`Tem a certeza que pretende eliminar "${toDelete?.name}"? Esta acção não pode ser revertida.`}
        onConfirm={confirmDelete}
        loading={pending}
      />
    </>
  );
}
