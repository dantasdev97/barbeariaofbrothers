"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Mail, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { ClientAvatar } from "@/components/admin/client-avatar";
import { DeleteAction } from "@/components/admin/row-actions";
import { staggerIndex } from "@/lib/motion";
import { shortUnitName } from "@/lib/event-labels";
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
  /** Data curta ("05 set"), já formatada no servidor. */
  lastVisit: string | null;
  /** Data por extenso, para o `title` — o formato curto é ambíguo. */
  lastVisitFull: string | null;
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
 * De onde veio a conta, em 16px.
 *
 * Era um crachá com a palavra "GOOGLE" ao lado do nome. Numa lista onde o
 * nome já compete com pontos e acções, isso roubava metade da linha — no
 * telemóvel truncava nomes ("Cristopher Pes…") para mostrar uma informação
 * secundária por extenso. O glifo diz o mesmo e o `title` + texto para
 * leitores de ecrã mantêm-no legível para quem precisa.
 */
function OriginGlyph({ provider }: { provider: string | null }) {
  const isGoogle = provider === "google";
  const label = isGoogle ? "Conta Google" : "Registo por formulário";
  return (
    <span
      title={label}
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
        isGoogle ? "bg-blue-500/12" : "bg-brand/15",
      )}
    >
      {isGoogle ? (
        <GoogleGlyph />
      ) : (
        <Mail className="h-2.5 w-2.5 text-brand" />
      )}
      <span className="sr-only">{label}</span>
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

/**
 * Saldo do cliente.
 *
 * Zero fica cinzento e não laranja: numa lista inteira de crachás cor de
 * marca, os que interessam — quem tem pontos para gastar — deixavam de
 * saltar à vista. E "pts" é lido letra a letra pelos leitores de ecrã, por
 * isso a palavra vai por extenso só para eles.
 */
function PointsPill({ points }: { points: number }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 font-mono text-[12px] font-bold tabular-nums",
        points > 0
          ? "bg-brand/15 text-brand"
          : "bg-muted text-muted-foreground",
      )}
    >
      {points}
      <span aria-hidden> pts</span>
      <span className="sr-only"> pontos</span>
    </span>
  );
}

export function ClientsTable({
  rows,
  canDelete,
  showUnit = true,
}: {
  rows: ClientRow[];
  canDelete: boolean;
  /**
   * Mostrar a unidade de cada cliente. Falso quando a lista já está filtrada
   * por unidade — repetir o mesmo nome em todas as linhas só ocupa espaço.
   */
  showUnit?: boolean;
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
        description="Ajuste a busca ou cadastre o primeiro cliente para começar a atribuir pontos no cartão fidelidade."
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
      {/* ── Mobile: uma linha por cliente ──
       * Antes era um cartão com avatar, crachá por extenso, contacto, uma
       * `<dl>` com unidade e última visita e ainda uma barra de acções com
       * separador — ~190px por cliente, três clientes por ecrã. A informação
       * é a mesma; o que mudou foi deixar de a dispor em blocos empilhados.
       *
       * O link cobre a linha inteira (`absolute inset-0`) em vez de embrulhar
       * o conteúdo: assim o alvo de toque é a linha toda e o botão de
       * eliminar continua a ser um botão a sério, não um clique aninhado. */}
      <ul className="stagger space-y-2 md:hidden">
        {rows.map((c, i) => (
          <li
            key={c.id}
            {...staggerIndex(i)}
            className="relative flex items-center gap-3 rounded-xl border border-border bg-bg-surface px-3 py-2.5 transition-colors duration-150 has-[a:active]:bg-background"
          >
            <Link
              href={`/admin/clientes/${c.id}`}
              aria-label={`Abrir ficha de ${c.name}`}
              className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            />
            <ClientAvatar name={c.name} url={c.avatarUrl} size="md" />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-[14.5px] font-semibold leading-tight">
                  {c.name}
                </h2>
                {c.selfRegistered && c.showOrigin && (
                  <OriginGlyph provider={c.authProvider} />
                )}
              </div>
              <p className="mt-0.5 truncate text-[12px] leading-tight text-muted-foreground">
                <span className="font-mono">{contactOf(c)}</span>
                {showUnit && <> · {shortUnitName(c.unitName)}</>}
              </p>
            </div>

            {/* Pontos e última visita à direita, em coluna. Estavam na linha
             * do contacto, onde o `truncate` os comia primeiro — a data,
             * que é o que diz se um cliente anda desaparecido, nunca chegava
             * a aparecer num email comprido. */}
            <div className="shrink-0 text-right">
              <PointsPill points={c.points} />
              <div
                className="mt-1 text-[11px] leading-none text-muted-foreground"
                title={
                  c.lastVisitFull
                    ? `Última visita: ${c.lastVisitFull}`
                    : "Sem visitas registadas"
                }
              >
                {c.lastVisit ?? "—"}
              </div>
            </div>

            {canDelete ? (
              <span className="relative z-10">
                <DeleteAction onClick={() => setToDelete(c)} label={c.name} />
              </span>
            ) : (
              <ChevronRight
                aria-hidden
                className="h-4 w-4 shrink-0 text-muted-foreground"
              />
            )}
          </li>
        ))}
      </ul>

      {/* ── Desktop: tabela ──
       * "Contacto" deixou de ser coluna e passou a segunda linha do nome: a
       * tabela tinha seis colunas para cinco dados e a de acções repetia o
       * link que o nome já é. */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-bg-surface md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Clientes do cartão fidelidade, do mais recente para o mais antigo.
          </caption>
          <thead className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th scope="col" className="px-5 py-2.5 text-left font-semibold">
                Cliente
              </th>
              {showUnit && (
                <th scope="col" className="px-5 py-2.5 text-left font-semibold">
                  Unidade
                </th>
              )}
              <th scope="col" className="px-5 py-2.5 text-right font-semibold">
                Pontos
              </th>
              <th scope="col" className="px-5 py-2.5 text-left font-semibold">
                Última visita
              </th>
              {canDelete && (
                <th scope="col" className="px-5 py-2.5">
                  <span className="sr-only">Acções</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="stagger divide-y divide-border">
            {rows.map((c, i) => (
              <tr
                key={c.id}
                {...staggerIndex(i)}
                className="transition-colors duration-150 hover-fine:hover:bg-background"
              >
                <td className="px-5 py-2">
                  <div className="flex items-center gap-2.5">
                    <ClientAvatar name={c.name} url={c.avatarUrl} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/clientes/${c.id}`}
                          className="truncate rounded-sm font-medium transition-colors duration-150 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                        >
                          {c.name}
                        </Link>
                        {c.selfRegistered && c.showOrigin && (
                          <OriginGlyph provider={c.authProvider} />
                        )}
                      </div>
                      <div className="max-w-[280px] truncate font-mono text-[11.5px] leading-tight text-muted-foreground">
                        {contactOf(c)}
                      </div>
                    </div>
                  </div>
                </td>
                {showUnit && (
                  <td className="px-5 py-2 text-[12.5px] text-muted-foreground">
                    {c.unitName}
                  </td>
                )}
                <td className="px-5 py-2 text-right">
                  <PointsPill points={c.points} />
                </td>
                <td
                  className="px-5 py-2 font-mono text-[12.5px] text-muted-foreground"
                  title={c.lastVisitFull ?? undefined}
                >
                  {c.lastVisit ?? "—"}
                </td>
                {canDelete && (
                  <td className="px-5 py-2">
                    <div className="flex justify-end">
                      <DeleteAction
                        onClick={() => setToDelete(c)}
                        label={c.name}
                      />
                    </div>
                  </td>
                )}
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
