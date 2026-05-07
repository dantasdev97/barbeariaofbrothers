"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { BarberRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteBarber } from "@/lib/admin-actions";

type UnitLite = { id: string; name: string; slug: string };

export function BarbersTable({
  barbers,
  units,
}: {
  barbers: BarberRow[];
  units: UnitLite[];
}) {
  const [pending, startTransition] = useTransition();
  const unitsById = new Map(units.map((u) => [u.id, u]));

  function onDelete(b: BarberRow) {
    if (!confirm(`Eliminar "${b.name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteBarber(b.id, b.unit_id);
        toast.success("Barbeiro eliminado.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  if (barbers.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-bg-surface p-10 text-center text-muted-foreground">
        Sem barbeiros ainda.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-bg-surface">
      <table className="w-full text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="p-4 text-left font-medium">Nome</th>
            <th className="p-4 text-left font-medium">Unidade</th>
            <th className="p-4 text-left font-medium">Especialidade</th>
            <th className="p-4 text-left font-medium">Estado</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {barbers.map((b) => (
            <tr key={b.id}>
              <td className="p-4 font-medium">{b.name}</td>
              <td className="p-4 text-muted-foreground">
                {unitsById.get(b.unit_id)?.name ?? "—"}
              </td>
              <td className="p-4 text-muted-foreground">{b.speciality ?? "—"}</td>
              <td className="p-4">
                <Badge
                  variant={b.active ? "default" : "secondary"}
                  className={b.active ? "bg-brand/20 text-brand" : ""}
                >
                  {b.active ? "Activo" : "Inactivo"}
                </Badge>
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/barbeiros/${b.id}`}>
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Editar
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => onDelete(b)}
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
