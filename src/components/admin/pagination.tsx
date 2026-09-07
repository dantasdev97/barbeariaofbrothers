import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Paginação das listas do admin.
 *
 * É feita de links (`<a href>`) e não de estado no cliente: a página vive no
 * URL, por isso é partilhável, sobrevive ao refresh e o botão "voltar" do
 * telemóvel funciona como toda a gente espera. Também é o único desenho que
 * permite paginar no servidor — que é o ponto: sem isto a lista pedia 200
 * clientes de uma vez e desenhava-os todos.
 *
 * Acessibilidade: a região vive num `<nav>` rotulado, a página actual é
 * marcada com `aria-current="page"` (e não só a negrito) e o resumo tem
 * `aria-live` para quem usa leitor de ecrã ouvir "21–40 de 62" depois de
 * mudar de página. Os alvos têm 40px de lado — o mínimo confortável.
 */

/**
 * Janela de páginas à volta da actual, com reticências.
 * `1 … 4 [5] 6 … 12` — nunca mais do que 7 entradas, para caber no telemóvel.
 */
function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const out: (number | "gap")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pageCount - 1, page + 1);
  if (from > 2) out.push("gap");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < pageCount - 1) out.push("gap");
  out.push(pageCount);
  return out;
}

const boxBase = cn(
  "inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-[13px] font-medium",
  "transition-[background-color,color,transform] duration-150 ease-out-strong",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
);

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  basePath,
  params = {},
  noun = ["resultado", "resultados"],
  className,
}: {
  /** Página actual, 1-based. */
  page: number;
  pageCount: number;
  /** Total de registos, para o resumo. */
  total: number;
  pageSize: number;
  basePath: string;
  /** Restantes parâmetros do URL a preservar (busca, filtros). */
  params?: Record<string, string | undefined>;
  /** Singular e plural do que está a ser listado. */
  noun?: [string, string];
  className?: string;
}) {
  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) qs.set(k, v);
    }
    // A página 1 não vai para o URL: mantém o endereço limpo e faz com que
    // uma busca nova e a primeira página sejam o mesmo endereço.
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Paginação"
      className={cn(
        "mt-4 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p
        className="text-center text-[12.5px] text-muted-foreground sm:text-left"
        aria-live="polite"
      >
        {total === 0 ? (
          `Sem ${noun[1]}`
        ) : (
          <>
            <span className="font-medium tabular-nums text-foreground">
              {first}–{last}
            </span>{" "}
            de{" "}
            <span className="font-medium tabular-nums text-foreground">
              {total}
            </span>{" "}
            {total === 1 ? noun[0] : noun[1]}
          </>
        )}
      </p>

      {pageCount > 1 && (
        <ul className="flex items-center justify-center gap-1">
          <li>
            {page > 1 ? (
              <Link
                href={href(page - 1)}
                rel="prev"
                aria-label="Página anterior"
                className={cn(
                  boxBase,
                  "gap-1 border border-border text-muted-foreground active:scale-[0.96] hover-fine:hover:bg-background hover-fine:hover:text-foreground",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </Link>
            ) : (
              <span
                aria-hidden
                className={cn(
                  boxBase,
                  "gap-1 border border-border text-muted-foreground opacity-40",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </span>
            )}
          </li>

          {/* Os números só aparecem a partir de sm. No telemóvel ocupavam a
           * largura toda e ficavam com alvos de toque de 24px. */}
          {pageWindow(page, pageCount).map((p, i) =>
            p === "gap" ? (
              <li
                key={`gap-${i}`}
                aria-hidden
                className="hidden px-1 text-muted-foreground sm:inline"
              >
                …
              </li>
            ) : (
              <li key={p} className="hidden sm:block">
                <Link
                  href={href(p)}
                  aria-label={`Página ${p}`}
                  aria-current={p === page ? "page" : undefined}
                  className={cn(
                    boxBase,
                    "tabular-nums active:scale-[0.96]",
                    p === page
                      ? "bg-brand text-[#0e0a07]"
                      : "border border-border text-muted-foreground hover-fine:hover:bg-background hover-fine:hover:text-foreground",
                  )}
                >
                  {p}
                </Link>
              </li>
            ),
          )}

          {/* Substituto dos números no telemóvel. */}
          <li className="px-2 text-[12.5px] tabular-nums text-muted-foreground sm:hidden">
            {page} / {pageCount}
          </li>

          <li>
            {page < pageCount ? (
              <Link
                href={href(page + 1)}
                rel="next"
                aria-label="Página seguinte"
                className={cn(
                  boxBase,
                  "gap-1 border border-border text-muted-foreground active:scale-[0.96] hover-fine:hover:bg-background hover-fine:hover:text-foreground",
                )}
              >
                <span className="hidden sm:inline">Seguinte</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span
                aria-hidden
                className={cn(
                  boxBase,
                  "gap-1 border border-border text-muted-foreground opacity-40",
                )}
              >
                <span className="hidden sm:inline">Seguinte</span>
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </li>
        </ul>
      )}
    </nav>
  );
}
