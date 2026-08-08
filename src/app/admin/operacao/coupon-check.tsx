"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, ScanLine, Ticket, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRewardValue } from "@/lib/loyalty/rewards";
import { consumeCoupon, lookupCoupon, type CouponLookup } from "@/lib/loyalty/actions";
import { cn } from "@/lib/utils";

/**
 * Validação do cupom ao balcão.
 *
 * Escrever ou colar o código é o caminho principal — foi o pedido explícito
 * de não obrigar a escanear. O scanner fica como atalho, para quem tiver o
 * QR do cupom à mão.
 *
 * Consultar e dar baixa são dois passos de propósito: o barbeiro vê de quem
 * é e o que dá antes de consumir, porque marcar usado é irreversível.
 */
export function CouponCheck() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [found, setFound] = useState<CouponLookup | null>(null);
  const [pending, startTransition] = useTransition();

  function check(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await lookupCoupon(code);
      if (!result.ok) {
        setFound(null);
        toast.error(result.error);
        return;
      }
      setFound(result.coupon);
    });
  }

  function confirm() {
    if (!found) return;
    startTransition(async () => {
      const result = await consumeCoupon(found.code);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.label} — cupom usado.`);
      setFound(null);
      setCode("");
      router.refresh();
    });
  }

  const value = found
    ? formatRewardValue(found.rewardKind, found.valueCents, found.percent)
    : null;

  return (
    <section className="mb-4 rounded-2xl border border-border bg-bg-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Ticket className="h-4 w-4 text-brand" />
          Validar cupom
        </h2>
        <Link
          href="/admin/operacao/scan"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[12.5px] text-muted-foreground transition-colors duration-150 hover-fine:hover:text-foreground"
        >
          <ScanLine className="h-4 w-4" />
          Escanear
        </Link>
      </div>

      <form onSubmit={check} className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="OB-XXXX-XXXX"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="h-12 flex-1 font-mono text-base tracking-wider"
        />
        <Button
          type="submit"
          disabled={pending || !code.trim()}
          className="h-12 bg-brand text-primary-foreground hover:bg-brand-hover sm:w-auto"
        >
          {pending && !found ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Consultar"
          )}
        </Button>
      </form>

      {found && (
        <div
          className={cn(
            "mt-4 animate-[enter-up_240ms_var(--ease-out-strong)_both] rounded-xl border p-4",
            found.status === "active"
              ? "border-brand/40 bg-brand/5"
              : "border-border bg-background",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-heading text-base font-semibold">
                {found.rewardLabel}
                {value && <span className="ml-2 text-brand">{value}</span>}
              </p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {found.clientName}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                found.status === "active"
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {found.status === "active"
                ? "Válido"
                : found.status === "used"
                  ? "Já usado"
                  : "Expirado"}
            </span>
          </div>

          {found.status === "used" && found.usedAt && (
            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              Utilizado em{" "}
              {new Date(found.usedAt).toLocaleString("pt-PT", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}

          {found.status === "active" && (
            <Button
              onClick={confirm}
              disabled={pending}
              className="mt-4 h-12 w-full bg-brand text-primary-foreground hover:bg-brand-hover"
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A dar baixa…
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Dar baixa no cupom
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
