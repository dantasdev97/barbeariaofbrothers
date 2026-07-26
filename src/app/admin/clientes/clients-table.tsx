"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import {
  DeleteAction,
  EditAction,
  RowActions,
} from "@/components/admin/row-actions";
import { staggerIndex } from "@/lib/motion";
import { deleteClient } from "@/lib/loyalty/actions";

export type ClientRow = {
  id: string;
  name: string;
  phone: string | null;
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
      <EmptyState
        icon={<Users className="h-6 w-6" />}
        title="Nenhum cliente encontrado"
        description="Cadastre o primeiro cliente para começar a atribuir pontos no cartão fidelidade."
        action={
          <Button
            asChild
            className="bg-brand text-primary-foreground hover:bg-brand-hover"
          >
            <Link href="/admin/clientes/novo">Cadastrar cliente</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      {/* Mobile: um cartão por cliente.
       * Antes era o mesmo `grid grid-cols-2` do desktop, que no telemóvel
       * empilhava nome/telefone/unidade/pontos/visita sem rótulo nenhum —
       * ficava impossível saber que número era qual. */}
      <div className="stagger space-y-3 md:hidden">
        {rows.map((c, i) => (
          <article
            key={c.id}
            {...staggerIndex(i)}
            className="rounded-xl border border-border bg-bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              {/* Só o bloco de identificação é link. Antes a linha inteira
               * era um `<Link className="contents">` com as acções lá
               * dentro — aninhamento frágil e alvo de toque imprevisível. */}
              <Link
                href={`/admin/clientes/${c.id}`}
                className="min-w-0 flex-1 rounded-md transition-opacity duration-150 ease-out-strong active:opacity-70"
              >
                <h2 className="truncate font-heading text-lg font-semibold">
                  {c.name}
                </h2>
                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                  {c.phone ?? "—"}
                </p>
              </Link>
              <span className="shrink-0 rounded-full bg-brand/15 px-2.5 py-1 font-mono text-[12px] font-bold tabular-nums text-brand">
                {c.points} pts
              </span>
            </div>

            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]">
              <div className="flex gap-1.5">
                <dt className="text-muted-foreground">Unidade</dt>
                <dd className="font-medium">{c.unitName}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-muted-foreground">Última visita</dt>
                <dd className="font-mono">{c.lastVisit ?? "—"}</dd>
              </div>
            </dl>

            <div className="mt-3 flex justify-end border-t border-border pt-3">
              <RowActions>
                <EditAction href={`/admin/clientes/${c.id}`} label={c.name} />
                {canDelete && (
                  <DeleteAction onClick={() => setToDelete(c)} label={c.name} />
                )}
              </RowActions>
            </div>
          </article>
        ))}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-bg-surface md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Nome</th>
              <th className="px-6 py-3 text-left font-semibold">Telefone</th>
              <th className="px-6 py-3 text-left font-semibold">Unidade</th>
              <th className="px-6 py-3 text-left font-semibold">Pontos</th>
              <th className="px-6 py-3 text-left font-semibold">Última visita</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="stagger divide-y divide-border">
            {rows.map((c, i) => (
              <tr
                key={c.id}
                {...staggerIndex(i)}
                className="transition-colors duration-150 hover-fine:hover:bg-background"
              >
                <td className="px-6 py-3">
                  <Link
                    href={`/admin/clientes/${c.id}`}
                    className="font-medium transition-colors duration-150 hover:text-brand"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-6 py-3 font-mono text-[12.5px] text-muted-foreground">
                  {c.phone ?? "—"}
                </td>
                <td className="px-6 py-3 text-[13px] text-muted-foreground">
                  {c.unitName}
                </td>
                <td className="px-6 py-3 font-mono text-[13px] font-semibold tabular-nums text-brand">
                  {c.points} pts
                </td>
                <td className="px-6 py-3 font-mono text-[12.5px] text-muted-foreground">
                  {c.lastVisit ?? "—"}
                </td>
                <td className="px-6 py-3">
                  <RowActions>
                    <EditAction href={`/admin/clientes/${c.id}`} label={c.name} />
                    {canDelete && (
                      <DeleteAction onClick={() => setToDelete(c)} label={c.name} />
                    )}
                  </RowActions>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
