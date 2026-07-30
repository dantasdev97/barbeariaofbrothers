"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, ExternalLink, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
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
import type {
  ClientRow,
  LoyaltyTransactionRow,
  UnitRow,
} from "@/types/database.types";

type UnitLite = Pick<UnitRow, "id" | "name" | "slug">;
type Lite = { id: string; name: string; unit_id: string };

export function ClientDetail({
  client,
  units,
  balances,
  transactions,
  services,
  rewards,
  cardUrl,
  children,
}: {
  client: ClientRow;
  units: UnitLite[];
  balances: Array<{ unit_id: string; balance: number }>;
  transactions: LoyaltyTransactionRow[];
  services: Lite[];
  rewards: Lite[];
  cardUrl: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustUnitId, setAdjustUnitId] = useState(client.unit_id);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [pending, startTransition] = useTransition();

  const unitName = (id: string) => units.find((u) => u.id === id)?.name ?? "—";
  const serviceName = (id: string | null) =>
    id ? services.find((s) => s.id === id)?.name ?? "—" : "";
  const rewardName = (id: string | null) =>
    id ? rewards.find((r) => r.id === id)?.name ?? "—" : "";

  function copyLink() {
    navigator.clipboard.writeText(cardUrl);
    toast.success("Link copiado.");
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

  return (
    <div>
      {children}

      <PageHeader
        title={client.name}
        description={
          <span className="font-mono">
            {client.phone ?? "sem telefone"} · {client.email ?? "sem email"} ·
            cadastrado em{" "}
            {unitName(client.unit_id)}
            {/* O @ que o cliente indicou ao reclamar o bónus de Instagram, para
             * se poder conferir se seguiu de facto. */}
            {client.instagram_handle && <> · @{client.instagram_handle}</>}
          </span>
        }
        actions={
          <>
            <Button variant="outline" onClick={copyLink}>
              <Copy className="mr-2 h-4 w-4" /> Link
            </Button>
            <a
              href={cardUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-transparent px-3 text-sm font-medium transition-[background-color,transform] duration-150 ease-out-strong hover-fine:hover:bg-background active:scale-[0.97]"
            >
              <ExternalLink className="h-4 w-4" /> Cartão
            </a>
            <Button
              onClick={() => setAdjustOpen(true)}
              className="bg-brand text-primary-foreground hover:bg-brand-hover"
            >
              Ajustar pontos
            </Button>
          </>
        }
      />

      {/* Saldos por unidade */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((u) => {
          const b = balances.find((x) => x.unit_id === u.id)?.balance ?? 0;
          return (
            <div key={u.id} className="rounded-2xl border border-border bg-bg-surface p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {u.name}
              </div>
              <div className="mt-2 font-heading text-[32px] font-semibold leading-none tracking-tight text-brand">
                {b} <span className="text-base text-muted-foreground">pts</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR + URL */}
      <div className="mb-6 rounded-2xl border border-border bg-bg-surface p-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <QrCode className="h-3.5 w-3.5" /> QR Code permanente
        </div>
        <div className="mt-2 break-all font-mono text-xs text-muted-foreground">
          {cardUrl}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Token: <span className="font-mono">{client.qr_token}</span>
        </div>
      </div>

      {/* Histórico */}
      <div className="overflow-hidden rounded-2xl border border-border bg-bg-surface">
        <div className="border-b border-border px-6 py-[22px]">
          <div className="font-heading text-base font-semibold tracking-tight">
            Histórico completo
          </div>
          <div className="mt-0.5 text-[12.5px] text-muted-foreground">
            {transactions.length} transaç{transactions.length === 1 ? "ão" : "ões"}
          </div>
        </div>
        {transactions.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted-foreground">
            Sem transações ainda.
          </p>
        ) : (
          transactions.map((tx) => {
            const d = new Date(tx.created_at);
            const sign = tx.points > 0 ? "+" : "";
            const detail =
              tx.type === "earn"
                ? serviceName(tx.service_id)
                : tx.type === "redeem"
                ? rewardName(tx.reward_id)
                : tx.note ?? "Ajuste";
            return (
              <div
                key={tx.id}
                className="grid gap-2 border-t border-border px-4 py-3 text-sm sm:px-6 md:grid-cols-[1.2fr_1.6fr_1fr_0.7fr] md:items-center md:gap-3"
              >
                <div className="font-mono text-[12.5px] text-muted-foreground">
                  {d.toLocaleString("pt-PT", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="text-[13px]">{detail}</div>
                <div className="text-[12.5px] text-muted-foreground">
                  {unitName(tx.unit_id)}
                </div>
                <div
                  className={`text-right font-mono font-semibold ${
                    tx.points > 0 ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  {sign}
                  {tx.points} pts
                </div>
              </div>
            );
          })
        )}
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
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
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
