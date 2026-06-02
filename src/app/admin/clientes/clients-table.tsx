"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteClient } from "@/lib/loyalty/actions";

export type ClientRow = {
  id: string;
  name: string;
  phone: string;
  unitName: string;
  points: number;
  lastVisit: string | null;
};

export function ClientsTable({
  rows,
  canDelete,
}: {
  rows: ClientRow[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<ClientRow | null>(null);

  function confirmDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      try {
        await deleteClient(toDelete.id);
        toast.success("Cliente eliminado.");
        setToDelete(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou eliminar o cliente.");
      }
    });
  }

  if (rows.length === 0) {
    return (
      <p className="px-6 py-12 text-center text-sm text-muted-foreground">
        Nenhum cliente encontrado.{" "}
        <Link href="/admin/clientes/novo" className="text-brand hover:underline">
          Cadastrar primeiro cliente.
        </Link>
      </p>
    );
  }

  return (
    <>
      {rows.map((c) => (
        <div
          key={c.id}
          className="grid grid-cols-2 gap-2 border-t border-border px-4 py-4 text-sm transition hover:bg-background sm:px-6 md:grid-cols-[2fr_1.4fr_1fr_1fr_1fr_auto] md:items-center md:gap-3"
        >
          <Link href={`/admin/clientes/${c.id}`} className="contents">
            <div className="font-medium">{c.name}</div>
            <div className="text-right font-mono text-[12.5px] text-muted-foreground md:text-left">
              {c.phone}
            </div>
            <div className="text-[13px] text-muted-foreground">{c.unitName}</div>
            <div className="font-mono text-[13px] font-semibold text-brand">
              {c.points} pts
            </div>
            <div className="font-mono text-[12.5px] text-muted-foreground">
              {c.lastVisit ?? "—"}
            </div>
          </Link>

          <div className="col-span-2 flex justify-end gap-1 md:col-span-1">
            <Link
              href={`/admin/clientes/${c.id}`}
              aria-label={`Editar ${c.name}`}
              title="Editar"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            {canDelete && (
              <button
                type="button"
                aria-label={`Eliminar ${c.name}`}
                title="Eliminar"
                onClick={() => setToDelete(c)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title="Eliminar cliente"
        description={`Tem a certeza que pretende eliminar "${toDelete?.name}"? O cartão de fidelidade e o histórico de pontos serão removidos. Esta acção não pode ser revertida.`}
        onConfirm={confirmDelete}
        loading={pending}
      />
    </>
  );
}
