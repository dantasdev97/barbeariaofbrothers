import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Cabeçalho padrão das páginas do admin: título, subtítulo e acções.
 *
 * Existia copiado em cada página com pequenas divergências de espaçamento e
 * tamanho de tipo. Centralizar aqui mantém o painel coerente e dá um único
 * sítio para mexer no ritmo vertical.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  /** Sobretítulo curto acima do h1 (ex. "Referência interna"). */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Botões à direita (desktop) / por baixo (mobile). */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-7 flex flex-col items-stretch gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand/80">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-[28px] font-semibold leading-none tracking-tight sm:text-[32px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {actions}
        </div>
      )}
    </header>
  );
}
