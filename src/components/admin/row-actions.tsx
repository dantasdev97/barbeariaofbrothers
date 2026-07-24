"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Acções de ícone das linhas de lista (editar / eliminar).
 *
 * O par estava copiado em unidades, barbeiros, produtos, categorias e
 * clientes, sempre com as mesmas classes de destructive à mão.
 *
 * O detalhe que interessa é o **alvo de toque**. Os ícones têm de continuar
 * com 32px para a densidade das listas não mudar, mas 32px é pequeno demais
 * para o polegar — o mínimo confortável é 44px. Em vez de engordar o botão,
 * alargamos só a zona clicável com um pseudo-elemento invisível
 * (`before:-inset-1.5`), que estende a área sensível sem ocupar espaço no
 * layout. O visual fica igual, o toque fica certo.
 */

const base = cn(
  "relative inline-flex h-8 w-8 items-center justify-center rounded-md",
  "transition-[background-color,color,transform] duration-150 ease-out-strong",
  "active:scale-[0.92]",
  "before:absolute before:-inset-1.5 before:content-['']",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
);

export function EditAction({
  href,
  onClick,
  label,
}: {
  /** Link de edição; se ausente, usa `onClick`. */
  href?: string;
  onClick?: () => void;
  /** Nome do item, para leitores de ecrã ("Editar João"). */
  label: string;
}) {
  const className = cn(
    base,
    "text-muted-foreground hover-fine:hover:bg-background hover-fine:hover:text-foreground",
  );

  if (href) {
    return (
      <Link href={href} aria-label={`Editar ${label}`} className={className}>
        <Pencil className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Editar ${label}`}
      className={className}
    >
      <Pencil className="h-4 w-4" />
    </button>
  );
}

export function DeleteAction({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Eliminar ${label}`}
      className={cn(
        base,
        "text-muted-foreground hover-fine:hover:bg-destructive/10 hover-fine:hover:text-destructive",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

/** Contentor que alinha as acções à direita da linha. */
export function RowActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-end gap-1", className)}>
      {children}
    </div>
  );
}
