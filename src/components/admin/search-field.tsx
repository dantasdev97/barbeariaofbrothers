"use client";

import { useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Campo de busca do painel.
 *
 * Procura enquanto se escreve, com uma pausa de 350ms — ao balcão, com o
 * cliente à frente, ter de escrever o nome todo e ainda carregar num botão é
 * tempo que se sente. A pausa existe para não disparar uma consulta por
 * tecla.
 *
 * O termo continua a viver no URL (`?q=`) e a navegação é `replace`, não
 * `push`: cada letra não deixa uma entrada no histórico, senão o botão
 * "voltar" teria de desfazer a palavra letra a letra.
 *
 * Sem JavaScript continua a funcionar: é um `<input name="q">` dentro de um
 * `<form method="get">`, e o Enter submete como sempre submeteu.
 */

/**
 * Navegação por parâmetros de URL, com pausa opcional.
 *
 * Fica aqui, e não em cada página, porque o cancelamento do temporizador ao
 * desmontar é o tipo de detalhe que se esquece na segunda cópia.
 */
export function useQueryNavigation(basePath: string, delay = 350) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const go = useCallback(
    (
      params: Record<string, string | undefined>,
      { debounce = false }: { debounce?: boolean } = {},
    ) => {
      const run = () => {
        const qs = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          const v = value?.trim();
          if (v) qs.set(key, v);
        }
        const url = qs.toString() ? `${basePath}?${qs}` : basePath;
        // `scroll: false`: a lista está por baixo do campo, e saltar para o
        // topo a cada letra tirava-a de vista.
        startTransition(() => router.replace(url, { scroll: false }));
      };

      if (timer.current) clearTimeout(timer.current);
      if (debounce) timer.current = setTimeout(run, delay);
      else run();
    },
    [basePath, delay, router],
  );

  return { go, pending };
}

export function SearchField({
  id,
  name = "q",
  label,
  placeholder,
  value,
  onValueChange,
  onClear,
  pending = false,
  autoFocus = false,
  className,
}: {
  id: string;
  name?: string;
  /** Rótulo para leitores de ecrã — um `placeholder` não é rótulo. */
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  onClear: () => void;
  pending?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        id={id}
        name={name}
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        // O `x` nativo do `type=search` no Safari/Chrome limpa o campo sem
        // disparar navegação nenhuma; escondê-lo e usar o nosso mantém o
        // ecrã e o URL de acordo.
        className={cn(
          "h-11 w-full rounded-md border border-input bg-transparent pl-9 pr-10 text-base outline-none transition-colors",
          "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm",
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />

      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
        {pending && (
          <Loader2
            aria-hidden
            className="h-4 w-4 animate-spin text-muted-foreground"
          />
        )}
        {!pending && value.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Limpar busca"
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-[background-color,color,transform] duration-150 ease-out-strong active:scale-[0.92] hover-fine:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
