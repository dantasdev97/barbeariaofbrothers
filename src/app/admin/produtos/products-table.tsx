"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ProductRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const unitsById = new Map(units.map((u) => [u.id, u]));

  function onDelete(p: ProductRow) {
    if (!confirm(`Eliminar "${p.name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteProduct(p.id, p.unit_id);
        toast.success("Produto eliminado.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-bg-surface p-10 text-center text-muted-foreground">
        Sem produtos ainda.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-bg-surface">
      <table className="w-full text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="p-4 text-left font-medium">Produto</th>
            <th className="p-4 text-left font-medium">Unidade</th>
            <th className="p-4 text-left font-medium">Preço</th>
            <th className="p-4 text-left font-medium">Estado</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {products.map((p) => (
            <tr key={p.id}>
              <td className="p-4 font-medium">{p.name}</td>
              <td className="p-4 text-muted-foreground">
                {unitsById.get(p.unit_id)?.name ?? "—"}
              </td>
              <td className="p-4 text-brand font-semibold">
                {formatPrice(p.price_cents)}
              </td>
              <td className="p-4">
                <Badge
                  variant={p.active ? "default" : "secondary"}
                  className={p.active ? "bg-brand/20 text-brand" : ""}
                >
                  {p.active ? "Activo" : "Inactivo"}
                </Badge>
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/produtos/${p.id}`}>
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Editar
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => onDelete(p)}
                    className="text-destructive hover:text-destructive"
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
  );
}
