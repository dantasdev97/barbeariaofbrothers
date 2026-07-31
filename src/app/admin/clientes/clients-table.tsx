"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import {
  DeleteAction,
  EditAction,
  RowActions,
} from "@/components/admin/row-actions";
import { staggerIndex } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { deleteClient } from "@/lib/loyalty/actions";

export type ClientRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  /** Criou o cartão sozinho, em vez de ser cadastrado ao balcão. */
  selfRegistered: boolean;
  /** Quem autenticou: `google`, `email`, ou null quando foi o staff a cadastrar. */
  authProvider: string | null;
  /** Foto de perfil, quando o provider a devolve. */
  avatarUrl: string | null;
  /**
   * Se se pode confiar no `authProvider`. Falso enquanto a migração da coluna
   * não correu — aí ele vem sempre null, e o crachá diria "Formulário" a
   * pessoas que entraram pela Google.
   */
  showOrigin: boolean;
  unitName: string;
  points: number;
  lastVisit: string | null;
};

/**
 * Telefone ou email — o que existir.
 *
 * Quem se regista pela Google não deixa telefone, e a coluna mostrava só
 * "—" para essas pessoas: apareciam na lista sem forma nenhuma de as
 * contactar ou identificar.
 */
function contactOf(c: ClientRow): string {
  return c.phone ?? c.email ?? "—";
}

/**
 * De onde veio a conta. Antes dizia só "Conta própria" para toda a gente —
 * não distinguia quem entrou pela Google de quem preencheu o formulário, que
 * é a diferença que interessa ao balcão (um tem foto e email verificado, o
 * outro pode ter escrito o que quis).
 */
function OriginBadge({ provider }: { provider: string | null }) {
  const isGoogle = provider === "google";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
        isGoogle
          ? "bg-blue-500/12 text-blue-600 dark:text-blue-400"
          : "bg-brand/15 text-brand",
      )}
    >
      {isGoogle ? <GoogleGlyph /> : <Mail className="h-2.5 w-2.5" />}
      {isGoogle ? "Google" : "Formulário"}
    </span>
  );
}

/** Logo da Google em miniatura — as cores da marca são obrigatórias. */
function GoogleGlyph() {
  return (
    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51Z" />
    </svg>
  );
}

/** Foto do cliente, com as iniciais como recurso quando não há. */
function Avatar({ name, url }: { name: string; url: string | null }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[12px] font-semibold text-brand">
      {initials || "?"}
    </div>
  );
}

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
                className="flex min-w-0 flex-1 items-center gap-3 rounded-md transition-opacity duration-150 ease-out-strong active:opacity-70"
              >
                <Avatar name={c.name} url={c.avatarUrl} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <h2 className="truncate font-heading text-lg font-semibold">
                      {c.name}
                    </h2>
                    {c.selfRegistered && c.showOrigin && (
                      <OriginBadge provider={c.authProvider} />
                    )}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">
                    {contactOf(c)}
                  </span>
                </span>
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
              <th className="px-6 py-3 text-left font-semibold">Contacto</th>
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
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} url={c.avatarUrl} />
                    <div className="flex min-w-0 items-center gap-2">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="truncate font-medium transition-colors duration-150 hover:text-brand"
                      >
                        {c.name}
                      </Link>
                      {c.selfRegistered && c.showOrigin && (
                      <OriginBadge provider={c.authProvider} />
                    )}
                    </div>
                  </div>
                </td>
                <td className="max-w-[220px] truncate px-6 py-3 font-mono text-[12.5px] text-muted-foreground">
                  {contactOf(c)}
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
