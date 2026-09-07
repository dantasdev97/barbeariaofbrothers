"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Maximize2, MapPin, QrCode, Sparkles } from "lucide-react";
import { AnimatedNumber } from "@/components/admin/animated-number";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * O cartão de fidelidade do cliente.
 *
 * Vivia copiado em dois sítios — no cartão público (`/cliente/[handle]`) e no
 * `/minha-conta` — com tamanhos e espaçamentos ligeiramente diferentes. Era o
 * mesmo cartão a parecer dois. Agora é um só: a página pública passa-o em
 * leitura, a página autenticada acrescenta as acções à volta.
 */

export type NextReward = {
  name: string;
  cost: number;
  /** Quantos faltam. Já calculado por quem chama. */
  missing: number;
  /** 0–100. */
  pct: number;
};

export function LoyaltyCard({
  name,
  unitName,
  balance,
  qrDataUrl,
  nextReward,
  bookingUrl,
  celebrateKey = 0,
  className,
}: {
  name: string;
  unitName: string | null;
  balance: number;
  /** PNG do QR, gerado no servidor. Sem ele, o bloco do QR não aparece. */
  qrDataUrl: string | null;
  nextReward: NextReward | null;
  /** Link de marcação da unidade, quando existe. */
  bookingUrl: string | null;
  /**
   * Muda de valor a cada resgate confirmado e faz o brilho passar uma vez.
   * É uma chave e não um booleano para o segundo resgate voltar a animar —
   * a animação reinicia porque o elemento é recriado.
   */
  celebrateKey?: number;
  className?: string;
}) {
  const [qrOpen, setQrOpen] = useState(false);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl bg-foreground p-1 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-foreground via-foreground to-[#1a1410] p-6 text-background ring-1 ring-inset ring-white/10 sm:p-8">
        {/* Halo da marca por trás do saldo. Dá profundidade ao cartão sem
         * imagem nenhuma — é um gradiente, não custa um pedido. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand/20 blur-3xl"
        />
        {/* Marca de água. Discreta de propósito: se se lê, está errada. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -bottom-8 -right-6 w-40 opacity-[0.06] select-none"
        />

        {celebrateKey > 0 && (
          <div
            key={celebrateKey}
            aria-hidden
            className="card-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
        )}

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
              <Sparkles aria-hidden className="h-3 w-3" />
              Cartão Fidelidade
            </p>
            {unitName && (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-background/90">
                <MapPin aria-hidden className="h-3 w-3" />
                {unitName}
              </p>
            )}
          </div>

          <h1 className="mt-4 font-heading text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]">
            {name}
          </h1>

          <div className="mt-5 flex items-end gap-2">
            <p className="font-heading text-[60px] font-bold leading-none tracking-tight tabular-nums text-brand sm:text-[68px]">
              <AnimatedNumber value={balance} />
            </p>
            {/* `/75` e não `/60`: sobre este fundo, 60% de opacidade fica
             * abaixo do contraste mínimo para texto pequeno. */}
            <p className="mb-2.5 text-sm uppercase tracking-[0.18em] text-background/75">
              pontos
            </p>
          </div>

          {nextReward && (
            <div className="mt-6 rounded-2xl bg-white/10 p-4">
              <div className="flex items-center justify-between gap-3 text-[12.5px]">
                <span className="text-background/85">
                  Falta para{" "}
                  <strong className="font-semibold text-background">
                    {nextReward.name}
                  </strong>
                </span>
                <span className="shrink-0 font-mono tabular-nums text-brand">
                  {nextReward.missing} pts
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={nextReward.pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progresso para ${nextReward.name}`}
                className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/15"
              >
                <div
                  className="progress-grow h-full rounded-full bg-brand"
                  style={{ width: `${nextReward.pct}%` }}
                />
              </div>
            </div>
          )}

          {qrDataUrl && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                className="group flex w-full flex-col items-center gap-3 rounded-2xl bg-background p-5 transition-transform duration-150 ease-out-strong active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="Código QR do seu cartão"
                  width={176}
                  height={176}
                  className="h-44 w-44"
                />
                <span className="flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-[0.14em] text-foreground/70">
                  <QrCode aria-hidden className="h-3.5 w-3.5" />
                  Mostre ao barbeiro
                  <Maximize2 aria-hidden className="h-3.5 w-3.5 opacity-60" />
                </span>
              </button>
            </div>
          )}

          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-[15px] font-semibold text-[#0e0a07] transition-[opacity,transform] duration-150 ease-out-strong hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
            >
              <CalendarPlus aria-hidden className="h-4 w-4" />
              Marcar corte
            </a>
          )}
        </div>
      </div>

      <QrDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        qrDataUrl={qrDataUrl}
        name={name}
      />
    </section>
  );
}

/**
 * O QR em grande, para o balcão.
 *
 * O ecrã do telemóvel escurece sozinho ao fim de uns segundos, e é
 * exactamente o que acontece enquanto o cliente espera que o barbeiro pegue
 * no aparelho — depois é preciso tocar outra vez para acordar. O
 * `wakeLock` segura o ecrã aceso enquanto este diálogo está aberto e
 * larga-o ao fechar.
 */
function QrDialog({
  open,
  onOpenChange,
  qrDataUrl,
  name,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrDataUrl: string | null;
  name: string;
}) {
  useEffect(() => {
    if (!open) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    // Falha em silêncio de propósito: o wake lock não existe em todos os
    // browsers e é recusado quando o separador não está visível. Sem ele o
    // ecrã escurece como sempre escureceu — não é caso para mensagem de erro.
    navigator.wakeLock
      ?.request("screen")
      .then((lock) => {
        if (cancelled) void lock.release();
        else sentinel = lock;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      void sentinel?.release();
    };
  }, [open]);

  if (!qrDataUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(92vw,26rem)] bg-white text-[#111827]">
        <DialogTitle className="text-center font-heading text-base font-semibold">
          {name}
        </DialogTitle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="Código QR do seu cartão"
          className="mx-auto h-auto w-full max-w-[20rem]"
        />
        <p className="text-center text-[13px] text-[#6b7280]">
          O barbeiro lê este código para somar os seus pontos.
        </p>
      </DialogContent>
    </Dialog>
  );
}
