"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MapPin, Sparkles, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { claimCard, createMyCard } from "@/lib/loyalty/client-actions";
import { staggerIndex } from "@/lib/motion";
import { cn } from "@/lib/utils";

type UnitLite = { id: string; name: string };

/**
 * Primeiro ecrã de quem acabou de criar conta e ainda não tem cartão.
 *
 * O caminho em destaque é criar um cartão novo — é o que serve quase toda a
 * gente, e não pede validação nenhuma: escolhe a unidade e está feito.
 * Recuperar um cartão de papel existente fica em segundo plano, porque só
 * interessa a quem já era cliente antes de haver contas.
 */
export function StartCard({
  units,
  defaultName,
}: {
  units: UnitLite[];
  defaultName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [name, setName] = useState(defaultName);
  const [showClaim, setShowClaim] = useState(false);
  const [handle, setHandle] = useState("");

  function start() {
    if (!unitId) return toast.error("Escolha a barbearia.");
    startTransition(async () => {
      const result = await createMyCard(unitId, name);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Cartão criado. Bem-vindo!");
      router.refresh();
    });
  }

  function claim() {
    const value = handle.trim();
    if (!value) return toast.error("Escreva o código do cartão.");
    startTransition(async () => {
      // Aceita o código solto ou o link inteiro colado do telemóvel.
      const match = value.match(/cliente\/([A-Za-z0-9-]+)/);
      const result = await claimCard(match?.[1] ?? value);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Cartão recuperado!");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <div className="stagger">
        <header {...staggerIndex(0)} className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
            <Sparkles className="h-3 w-3" />
            Cartão Fidelidade
          </span>
          <h1 className="mt-4 font-heading text-[30px] font-semibold leading-tight tracking-tight sm:text-[36px]">
            Falta só escolher a barbearia
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            O seu cartão é criado na hora e já entra com pontos de boas-vindas.
          </p>
        </header>

        <div
          {...staggerIndex(1)}
          className="mt-8 rounded-2xl border border-border bg-bg-surface p-5"
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Onde costuma cortar
          </p>
          <div className="grid gap-2">
            {units.map((u) => {
              const active = unitId === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUnitId(u.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-xl border px-4 text-left",
                    "transition-[border-color,background-color,transform] duration-150 ease-out-strong active:scale-[0.99]",
                    active
                      ? "border-brand bg-brand/10"
                      : "border-border bg-background hover-fine:hover:border-brand/40",
                  )}
                >
                  <MapPin
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-brand" : "text-muted-foreground",
                    )}
                  />
                  <span className="font-medium">{u.name}</span>
                  <span
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0 rounded-full border-2 transition-colors duration-150",
                      active ? "border-brand bg-brand" : "border-border",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <label
            htmlFor="start-name"
            className="mt-5 mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
          >
            Como quer ser tratado
          </label>
          <Input
            id="start-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="O seu nome"
            className="h-11"
          />

          <Button
            onClick={start}
            disabled={pending}
            size="lg"
            className="mt-5 h-12 w-full bg-brand text-primary-foreground hover:bg-brand-hover"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A criar…
              </>
            ) : (
              "Criar o meu cartão"
            )}
          </Button>
        </div>

        {/* Recuperar cartão de papel — caminho secundário de propósito. */}
        <div {...staggerIndex(2)} className="mt-6 text-center">
          {!showClaim ? (
            <button
              type="button"
              onClick={() => setShowClaim(true)}
              className="min-h-11 px-3 text-sm text-muted-foreground underline underline-offset-4 transition-colors duration-150 hover-fine:hover:text-foreground"
            >
              Já tenho um cartão da barbearia
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-bg-surface p-5 text-left">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Ticket className="h-4 w-4 text-brand" />
                Recuperar cartão existente
              </p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Escreva o código do cartão, ou basta escanear o QR dele para
                trazer os pontos que já tem.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="Código ou link do cartão"
                  className="h-11 flex-1"
                />
                <Button
                  onClick={claim}
                  disabled={pending}
                  variant="secondary"
                  className="h-11 sm:w-auto"
                >
                  Recuperar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
