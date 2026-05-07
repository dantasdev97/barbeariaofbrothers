"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { UnitRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteUnit } from "@/lib/admin-actions";

export function UnitsTable({ units }: { units: UnitRow[] }) {
  const [pending, startTransition] = useTransition();

  function onDelete(u: UnitRow) {
    if (!confirm(`Eliminar a unidade "${u.name}"? Esta acção não pode ser revertida.`)) return;
    startTransition(async () => {
      try {
        await deleteUnit(u.id, u.slug);
        toast.success("Unidade eliminada.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  if (units.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-bg-surface p-10 text-center text-muted-foreground">
        Nenhuma unidade ainda. Crie a primeira para começar.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-bg-surface">
      <table className="w-full text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="p-4 text-left font-medium">Nome</th>
            <th className="p-4 text-left font-medium">Slug</th>
            <th className="p-4 text-left font-medium">Estado</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {units.map((u) => (
            <tr key={u.id}>
              <td className="p-4 font-medium">{u.name}</td>
              <td className="p-4 font-mono text-xs text-muted-foreground">{u.slug}</td>
              <td className="p-4">
                <Badge
                  variant={u.active ? "default" : "secondary"}
                  className={u.active ? "bg-brand/20 text-brand" : ""}
                >
                  {u.active ? "Activa" : "Inactiva"}
                </Badge>
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/unidades/${u.id}`}>
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Editar
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => onDelete(u)}
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
