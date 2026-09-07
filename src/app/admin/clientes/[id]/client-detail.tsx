"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AtSign,
  Copy,
  ExternalLink,
  Gift,
  Mail,
  Phone,
  Plus,
  QrCode,
  Settings2,
  Sparkles,
  Store,
} from "lucide-react";
import { InstagramIcon } from "@/components/public/social-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/admin/form-bits";
import { loyaltyAdjust } from "@/lib/loyalty/actions";
import { staggerIndex } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Uma linha do extracto, já traduzida e datada pelo servidor. */
export type TxView = {
  id: string;
  type: string;
  points: number;
  /** Serviço, recompensa ou motivo do ajuste. */
  detail: string;
  unitName: string;
  /** "05 set, 14:32" */
  when: string;
  /** Data por extenso, para o `title`. */
  fullDate: string;
};

type UnitLite = { id: string; name: string; slug: string };

type ClientView = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  unitId: string;
  unitName: string;
  instagramHandle: string | null;
  qrToken: string;
  avatarUrl: string | null;
  authProvider: string | null;
  selfRegistered: boolean;
  /** "12 de agosto de 2026" */
  createdAt: string;
};

type Filter = "all" | "earn" | "redeem" | "other";

const TX_STYLE: Record<
  string,
  { label: string; chip: string; icon: typeof Plus }
> = {
  earn: {
    label: "Ganho",
    chip: "bg-emerald-500/12 text-emerald-600",
    icon: Plus,
  },
  bonus: { label: "Bónus", chip: "bg-blue-500/12 text-blue-600", icon: Sparkles },
  redeem: { label: "Resgate", chip: "bg-brand/12 text-brand", icon: Gift },
  adjust: {
    label: "Ajuste",
    chip: "bg-muted text-muted-foreground",
    icon: Settings2,
  },
};

function txStyle(type: string) {
  return TX_STYLE[type] ?? TX_STYLE.adjust;
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
        className="h-14 w-14 shrink-0 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      aria-hidden
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand/10 font-heading text-lg font-semibold text-brand"
    >
      {initials || "?"}
    </div>
  );
}

/**
 * Contacto copiável.
 *
 * O cabeçalho mostrava telefone, email e unidade numa linha de texto
 * monoespaçado que dava a volta em duas linhas no telemóvel. Aqui cada dado
 * é uma peça só, com o seu ícone — e clicar copia, que é o que se faz a
 * seguir a olhar para um email (colá-lo no WhatsApp ou no email).
 */
function ContactChip({
  icon,
  value,
  empty,
  onCopy,
}: {
  icon: React.ReactNode;
  value: string | null;
  empty: string;
  onCopy: (value: string) => void;
}) {
  if (!value) {
    return (
      <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-dashed border-border px-3 text-[12.5px] text-muted-foreground">
        <span aria-hidden>{icon}</span>
        {empty}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onCopy(value)}
      title={`Copiar ${value}`}
      className="group inline-flex h-9 max-w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-[12.5px] transition-[background-color,transform] duration-150 ease-out-strong active:scale-[0.97] hover-fine:hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <span aria-hidden className="text-muted-foreground">
        {icon}
      </span>
      <span className="truncate font-mono">{value}</span>
      <Copy
        aria-hidden
        className="h-3 w-3 shrink-0 text-muted-foreground opacity-60"
      />
      <span className="sr-only">Copiar</span>
    </button>
  );
}

export function ClientDetail({
  client,
  units,
  unitBalances,
  totalPoints,
  transactions,
  cardUrl,
  qrDataUrl,
}: {
  client: ClientView;
  units: UnitLite[];
  unitBalances: Array<{ unitId: string; unitName: string; balance: number }>;
  totalPoints: number;
  transactions: TxView[];
  cardUrl: string;
  qrDataUrl: string;
}) {
  const router = useRouter();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustUnitId, setAdjustUnitId] = useState(client.unitId);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>("all");
  const [visible, setVisible] = useState(20);

  const counts = useMemo(
    () => ({
      all: transactions.length,
      earn: transactions.filter((t) => t.type === "earn" || t.type === "bonus")
        .length,
      redeem: transactions.filter((t) => t.type === "redeem").length,
      other: transactions.filter((t) => t.type === "adjust").length,
    }),
    [transactions],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    if (filter === "earn")
      return transactions.filter((t) => t.type === "earn" || t.type === "bonus");
    if (filter === "redeem")
      return transactions.filter((t) => t.type === "redeem");
    return transactions.filter((t) => t.type === "adjust");
  }, [transactions, filter]);

  function copy(value: string, message = "Copiado.") {
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(message))
      .catch(() => toast.error("Não foi possível copiar."));
  }

  function submitAdjust() {
    const pts = Number(adjustPoints);
    if (!Number.isInteger(pts) || pts === 0)
      return toast.error("Pontos inválidos (use número, positivo ou negativo).");
    if (!adjustNote.trim()) return toast.error("Indique o motivo.");

    startTransition(async () => {
      try {
        await loyaltyAdjust(client.id, adjustUnitId, pts, adjustNote.trim());
        toast.success("Ajuste registado.");
        setAdjustOpen(false);
        setAdjustPoints("");
        setAdjustNote("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falhou.");
      }
    });
  }

  const originLabel = !client.selfRegistered
    ? "Cadastrado ao balcão"
    : client.authProvider === "google"
      ? "Conta Google"
      : "Conta própria";

  return (
    <div className="space-y-4">
      {/* ── Identidade ── */}
      <section className="rounded-2xl border border-border bg-bg-surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={client.name} url={client.avatarUrl} />
            <h1 className="min-w-0 truncate font-heading text-[24px] font-semibold leading-tight tracking-tight sm:text-[28px]">
              {client.name}
            </h1>
          </div>

          {/* No telemóvel a acção principal ocupa a linha toda e vem primeiro:
           * lançar pontos é o que se faz aqui com o cliente à frente. Em
           * ecrã largo volta a ser uma barra de botões. */}
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:items-center">
            <Button
              onClick={() => setAdjustOpen(true)}
              className="col-span-2 h-11 bg-brand text-primary-foreground hover:bg-brand-hover sm:order-last sm:h-9"
            >
              Ajustar pontos
            </Button>
            <a
              href={cardUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-[background-color,transform] duration-150 ease-out-strong hover-fine:hover:bg-muted active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:h-9"
            >
              <ExternalLink className="h-4 w-4" /> Cartão
            </a>
            <Button
              variant="outline"
              className="h-10 sm:h-9"
              onClick={() => copy(cardUrl, "Link do cartão copiado.")}
            >
              <Copy className="mr-2 h-4 w-4" /> Link
            </Button>
          </div>
        </div>

        {/* Unidade, origem da conta e antiguidade: era tudo uma linha de
         * monoespaçado no subtítulo, que no telemóvel dava a volta em três
         * linhas encostadas ao avatar. */}
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Store aria-hidden className="h-3.5 w-3.5" />
            {client.unitName}
          </span>
          <span aria-hidden>·</span>
          <span>{originLabel}</span>
          <span aria-hidden>·</span>
          <span>desde {client.createdAt}</span>
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <ContactChip
            icon={<Phone className="h-3.5 w-3.5" />}
            value={client.phone}
            empty="sem telefone"
            onCopy={(v) => copy(v, "Telefone copiado.")}
          />
          <ContactChip
            icon={<Mail className="h-3.5 w-3.5" />}
            value={client.email}
            empty="sem email"
            onCopy={(v) => copy(v, "Email copiado.")}
          />
          {/* O @ que o cliente indicou ao reclamar o bónus de Instagram: o link
           * abre o perfil para se poder conferir se seguiu de facto. */}
          {client.instagramHandle && (
            <a
              href={`https://instagram.com/${client.instagramHandle}`}
              target="_blank"
              rel="noopener"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-[12.5px] transition-[background-color,transform] duration-150 ease-out-strong active:scale-[0.97] hover-fine:hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <InstagramIcon aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono">@{client.instagramHandle}</span>
              <ExternalLink aria-hidden className="h-3 w-3 opacity-60" />
            </a>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px] lg:items-start">
        {/* ── Saldo ──
         * Era um cartão gigante por unidade, com o mesmo peso visual para a
         * unidade onde o cliente gasta os pontos e para aquela onde tem zero.
         * O total passou a existir (não existia) e as unidades são linhas. */}
        <section
          aria-labelledby="saldo"
          className="rounded-2xl border border-border bg-bg-surface p-5 lg:col-start-1"
        >
          <h2
            id="saldo"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
          >
            Saldo de pontos
          </h2>
          <p className="mt-2 font-heading text-[36px] font-semibold leading-none tracking-tight text-brand">
            {totalPoints}
            <span className="ml-1 text-base text-muted-foreground">
              <span aria-hidden>pts</span>
              <span className="sr-only">pontos no total</span>
            </span>
          </p>

          <ul className="mt-4 divide-y divide-border border-t border-border">
            {unitBalances.map((u) => (
              <li
                key={u.unitId}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2 text-[13px]">
                  <span className="truncate">{u.unitName}</span>
                  {u.unitId === client.unitId && (
                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      cadastro
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-[13px] font-semibold tabular-nums",
                    u.balance > 0 ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {u.balance}
                  <span aria-hidden> pts</span>
                  <span className="sr-only"> pontos</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── QR ── */}
        <section
          aria-labelledby="qr"
          className="rounded-2xl border border-border bg-bg-surface p-5 lg:col-start-2 lg:row-span-2"
        >
          <h2
            id="qr"
            className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
          >
            <QrCode aria-hidden className="h-3.5 w-3.5" /> QR permanente
          </h2>

          {/* Fundo branco fixo, também em tema escuro: um QR invertido não é
           * lido por metade dos leitores. */}
          <div className="mt-3 flex justify-center rounded-xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`Código QR do cartão de ${client.name}`}
              width={200}
              height={200}
              className="h-auto w-full max-w-[200px]"
            />
          </div>

          <p className="mt-3 break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
            {cardUrl}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Token: <span className="font-mono">{client.qrToken}</span>
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy(cardUrl, "Link do cartão copiado.")}
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy(client.qrToken, "Token copiado.")}
            >
              <AtSign className="mr-1.5 h-3.5 w-3.5" /> Token
            </Button>
          </div>
        </section>

        {/* ── Histórico ── */}
        <section
          aria-labelledby="historico"
          className="overflow-hidden rounded-2xl border border-border bg-bg-surface lg:col-start-1"
        >
          <div className="px-5 py-4">
            <h2
              id="historico"
              className="font-heading text-base font-semibold tracking-tight"
            >
              Histórico
            </h2>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              {transactions.length} transaç
              {transactions.length === 1 ? "ão" : "ões"}
              {transactions.length === 100 && " (as mais recentes)"}
            </p>

            {/* Filtros. Numa ficha com dezenas de linhas, procurar o resgate
             * de que o cliente se queixa à vista desarmada é lento. */}
            {transactions.length > 0 && (
              <div
                role="group"
                aria-label="Filtrar histórico"
                className="mt-3 flex flex-wrap gap-1.5"
              >
                {(
                  [
                    ["all", "Todos", counts.all],
                    ["earn", "Ganhos", counts.earn],
                    ["redeem", "Resgates", counts.redeem],
                    ["other", "Ajustes", counts.other],
                  ] as const
                ).map(([id, label, n]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setFilter(id);
                      setVisible(20);
                    }}
                    aria-pressed={filter === id}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium",
                      "transition-[background-color,color,transform] duration-150 ease-out-strong active:scale-[0.96]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                      filter === id
                        ? "bg-brand text-[#0e0a07]"
                        : "border border-border text-muted-foreground hover-fine:hover:text-foreground",
                    )}
                  >
                    {label}
                    <span className="font-mono tabular-nums opacity-70">{n}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="border-t border-border px-5 py-10 text-center text-sm text-muted-foreground">
              {transactions.length === 0
                ? "Sem transações ainda."
                : "Nada neste filtro."}
            </p>
          ) : (
            <>
              <ul className="stagger">
                {filtered.slice(0, visible).map((tx, i) => {
                  const style = txStyle(tx.type);
                  const Icon = style.icon;
                  return (
                    <li
                      key={tx.id}
                      {...staggerIndex(i)}
                      className="flex items-center gap-3 border-t border-border px-4 py-2.5 sm:px-5"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          style.chip,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13.5px] font-medium leading-tight">
                            {tx.detail}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]",
                              style.chip,
                            )}
                          >
                            {style.label}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11.5px] leading-tight text-muted-foreground">
                          {tx.unitName} · <span title={tx.fullDate}>{tx.when}</span>
                        </p>
                      </div>

                      <span
                        className={cn(
                          "shrink-0 font-mono text-[13px] font-semibold tabular-nums",
                          tx.points > 0 ? "text-emerald-600" : "text-destructive",
                        )}
                      >
                        {tx.points > 0 ? "+" : ""}
                        {tx.points}
                        <span aria-hidden> pts</span>
                        <span className="sr-only"> pontos</span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              {filtered.length > visible && (
                <div className="border-t border-border p-3">
                  <button
                    type="button"
                    onClick={() => setVisible((v) => v + 20)}
                    className="h-10 w-full rounded-lg text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover-fine:hover:bg-background hover-fine:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    Ver mais {Math.min(20, filtered.length - visible)} de{" "}
                    {filtered.length - visible}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuste manual de pontos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field id="adj-unit" label="Unidade *">
              <select
                id="adj-unit"
                value={adjustUnitId}
                onChange={(e) => setAdjustUnitId(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="adj-points"
              label="Pontos *"
              hint="Positivo para adicionar, negativo para retirar. Não pode ser zero."
            >
              <Input
                id="adj-points"
                type="number"
                inputMode="numeric"
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(e.target.value)}
                placeholder="ex: 10 ou -5"
              />
              {/* Atalhos para os valores do dia-a-dia: ao balcão, escrever
               * "10" num teclado numérico com o cliente à espera é mais
               * lento do que tocar uma vez. */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[5, 10, 20, -10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAdjustPoints(String(n))}
                    className="inline-flex h-8 items-center rounded-full border border-border px-3 font-mono text-[12.5px] text-muted-foreground transition-[background-color,color,transform] duration-150 ease-out-strong active:scale-[0.96] hover-fine:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    {n > 0 ? `+${n}` : n}
                  </button>
                ))}
              </div>
            </Field>
            <Field id="adj-note" label="Motivo *">
              <Textarea
                id="adj-note"
                rows={2}
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="ex: correção, presente, erro de lançamento"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAdjustOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={submitAdjust}
                disabled={pending}
                className="bg-brand text-primary-foreground hover:bg-brand-hover"
              >
                {pending ? "A guardar…" : "Confirmar ajuste"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
