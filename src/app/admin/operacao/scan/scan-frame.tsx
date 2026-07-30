"use client";

import { cn } from "@/lib/utils";

/**
 * Moldura de mira do scanner.
 *
 * Antes era um quadrado branco com borda e nada mais: não distinguia "a ligar"
 * de "à procura" de "encontrei", e durante a validação o ecrã ficava preto sem
 * explicação. Os quatro cantos são a convenção que se lê como mira, e o feixe
 * é o que diz que está mesmo a trabalhar.
 *
 * Tudo em CSS (ver globals.css): com a câmara ligada, o jsQR ocupa a main
 * thread a cada frame e animação em JS engasgaria.
 */
export type ScanPhase = "starting" | "scanning" | "found";

const CORNER_BASE =
  "absolute h-7 w-7 border-current transition-colors duration-200 ease-out-strong";

export function ScanFrame({ phase }: { phase: ScanPhase }) {
  const found = phase === "found";
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center",
        // Escurece tudo o que está fora da mira, dirigindo o olhar ao centro.
        "[--dim:rgba(0,0,0,0.45)]",
      )}
    >
      <div
        className={cn(
          "relative h-3/5 w-3/5 rounded-2xl",
          "shadow-[0_0_0_9999px_var(--dim)]",
          // A mira aperta ao encontrar — o gesto de "travar no alvo".
          "transition-[transform,color] duration-300 ease-out-strong",
          found ? "scale-[0.94] text-emerald-400" : "scale-100 text-brand",
        )}
      >
        {/* Feixe de varrimento: só enquanto procura. */}
        {phase === "scanning" && (
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="scan-beam absolute inset-x-0 top-0 h-1/3 animate-scan-sweep">
              <div className="h-full w-full bg-gradient-to-b from-transparent to-brand/25" />
              <div className="h-px w-full bg-brand shadow-[0_0_12px_2px_var(--brand)]" />
            </div>
          </div>
        )}

        {/* Cantos. A respiração é só no arranque: aí ainda não há feixe e é ela
         * que diz que algo está a acontecer. Com o feixe a varrer seria
         * movimento a competir com movimento. */}
        {(
          [
            ["-left-px -top-px rounded-tl-2xl border-l-[3px] border-t-[3px]", "0ms"],
            ["-right-px -top-px rounded-tr-2xl border-r-[3px] border-t-[3px]", "150ms"],
            ["-bottom-px -right-px rounded-br-2xl border-b-[3px] border-r-[3px]", "300ms"],
            ["-bottom-px -left-px rounded-bl-2xl border-b-[3px] border-l-[3px]", "450ms"],
          ] as const
        ).map(([corner, delay]) => (
          <span
            key={corner}
            className={cn(
              CORNER_BASE,
              "scan-corner",
              corner,
              phase === "starting" && "animate-scan-breathe",
            )}
            style={phase === "starting" ? { animationDelay: delay } : undefined}
          />
        ))}
      </div>
    </div>
  );
}
