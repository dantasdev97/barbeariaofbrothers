"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * O código do cupom com botão de copiar.
 *
 * É a peça que o dono descreveu ao detalhe: *"já cria um código e já tem
 * aqueles dois quadradinhos pra copiar... tu clica ali, já copiou, depois é
 * só colar"*.
 *
 * Duas decisões que importam:
 *
 * - **Confirmar a cópia.** Sem o "Copiado" o cliente carrega três vezes sem
 *   saber se resultou. Volta ao normal ao fim de 2s.
 * - **`tracking` largo e `tabular-nums`.** O código também é dito em voz
 *   alta ao balcão, por isso tem de se ler carácter a carácter sem esforço.
 */
export function CouponCode({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sem isto, sair da página com o temporizador a correr deixa um setState
  // pendente sobre um componente já desmontado.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Safari em contexto não seguro, ou permissão negada: seleccionar o
      // texto ainda deixa o utilizador copiar à mão.
      const range = document.createRange();
      const node = document.getElementById(`coupon-${code}`);
      if (node) {
        range.selectNodeContents(node);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        "flex items-stretch gap-2 rounded-2xl border-2 border-dashed border-border bg-bg-surface p-2",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center justify-center px-2 py-3">
        <span
          id={`coupon-${code}`}
          className="truncate font-mono text-[22px] font-bold tracking-[0.12em] tabular-nums sm:text-[26px]"
        >
          {code}
        </span>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Código copiado" : "Copiar código"}
        className={cn(
          "inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold",
          "transition-[background-color,color,transform] duration-150 ease-out-strong active:scale-[0.95]",
          copied
            ? "bg-emerald-500/15 text-emerald-600"
            : "bg-foreground text-background hover-fine:hover:opacity-90",
        )}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        <span className="hidden sm:inline">{copied ? "Copiado" : "Copiar"}</span>
      </button>
    </div>
  );
}
