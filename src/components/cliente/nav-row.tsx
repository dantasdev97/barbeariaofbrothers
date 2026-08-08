import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { staggerIndex } from "@/lib/motion";

/**
 * Linha de navegação do cartão "Pontos" — ícone, título e seta.
 *
 * É um alvo de toque, não uma linha de texto: daí a altura mínima de 56px
 * e o `active:` a dar retorno ao dedo.
 */
export function NavRow({
  href,
  icon,
  title,
  description,
  index = 0,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  index?: number;
}) {
  return (
    <Link
      href={href}
      {...staggerIndex(index)}
      className={`flex min-h-14 items-center gap-4 px-5 py-4 transition-[background-color,transform] duration-150 ease-out-strong hover-fine:hover:bg-background active:scale-[0.99] ${
        index > 0 ? "border-t border-border" : ""
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">{title}</p>
        {description && (
          <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
