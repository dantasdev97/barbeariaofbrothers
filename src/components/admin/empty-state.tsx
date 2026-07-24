import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Estado vazio das listas do admin.
 *
 * O padrão vinha de `units-table.tsx` (ícone em círculo, título, explicação,
 * acção) e era o melhor do painel — mas só existia lá. Noutras listas o vazio
 * era um `<p>` solto, sem dizer ao utilizador o que fazer a seguir.
 *
 * O ícone entra já renderizado para poder ser usado a partir de páginas
 * server sem atravessar a fronteira como função.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Botão ou link que resolve o vazio. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-border bg-bg-surface px-6 py-16 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="font-heading text-base font-semibold">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
