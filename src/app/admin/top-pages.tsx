import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TopPage = {
  path: string;
  /** Nome legível ("Produto · Óleo de barba"). */
  label: string;
  views: number;
};

/**
 * Páginas mais vistas do site público.
 *
 * Ocupa o lugar do "Top barbeiros", que rankeava visualizações de barbeiro —
 * um recorte estreito dos mesmos dados. Isto responde à pergunta que o dono
 * faz de facto: onde é que as pessoas passam tempo no site.
 *
 * A barra é a proporção face à página mais vista, não uma percentagem do
 * total: com 20 páginas, percentagens do total seriam todas barras
 * invisíveis.
 */
export function TopPages({
  rows,
  days,
  className,
}: {
  rows: TopPage[];
  days: number;
  className?: string;
}) {
  const max = rows[0]?.views ?? 1;

  return (
    <section
      aria-labelledby="top-paginas"
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-bg-surface",
        className,
      )}
    >
      <div className="px-5 py-4 sm:px-6 sm:py-[18px]">
        <h2
          id="top-paginas"
          className="font-heading text-base font-semibold tracking-tight"
        >
          Páginas mais vistas
        </h2>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          Últimos {days} dias
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border-t border-border px-6 py-12 text-center">
          <BarChart3 aria-hidden className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sem visitas neste período.
          </p>
        </div>
      ) : (
        <ol className="stagger border-t border-border px-5 py-2 sm:px-6">
          {rows.map((r, i) => (
            <li
              key={r.path}
              style={{ "--stagger-index": Math.min(i, 12) } as React.CSSProperties}
              className="py-2.5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[13px] font-medium">
                  {r.label}
                </span>
                <span className="shrink-0 font-mono text-[12.5px] font-semibold tabular-nums text-brand">
                  {r.views}
                  <span className="sr-only"> visualizações</span>
                </span>
              </div>
              <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                {r.path}
              </div>
              {/* `aria-hidden`: a barra é a mesma informação do número ao
               * lado, desenhada. Anunciá-la duas vezes só atrasa quem ouve. */}
              <div
                aria-hidden
                className="mt-1.5 h-1 overflow-hidden rounded-full bg-background"
              >
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out-strong"
                  style={{ width: `${Math.max(4, Math.round((r.views / max) * 100))}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
