import Link from "next/link";
import { CalendarRange, X } from "lucide-react";
import { dayKey, PRESETS, type DateRange } from "@/lib/date-range";
import { cn } from "@/lib/utils";

/**
 * Filtro de datas do painel.
 *
 * Presets em links e intervalo personalizado num formulário GET — o estado
 * vive no URL, por isso é partilhável, sobrevive ao refresh e o botão
 * "voltar" funciona. Também é o que permite o filtro ser aplicado na consulta
 * ao servidor em vez de esconder linhas no browser.
 *
 * Os presets cobrem o dia-a-dia (é o que se pergunta a um painel: "como
 * correu a semana?"); o intervalo com datas fica para as perguntas concretas,
 * como comparar com o mês passado.
 */
export function DateFilter({
  range,
  basePath,
  className,
}: {
  range: DateRange;
  basePath: string;
  className?: string;
}) {
  const today = dayKey();

  return (
    <section
      aria-label="Filtrar por data"
      className={cn(
        "mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      {/* Os presets rolam na horizontal no telemóvel em vez de partir em duas
       * linhas — quatro chips e um intervalo não cabem em 390px. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 lg:pb-0">
        {PRESETS.map((p) => {
          const active = range.preset === p.value;
          return (
            <Link
              key={p.value}
              href={
                p.value === "30" ? basePath : `${basePath}?dias=${p.value}`
              }
              aria-current={active ? "true" : undefined}
              className={cn(
                "inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium",
                "transition-[background-color,color,transform] duration-150 ease-out-strong active:scale-[0.96]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                active
                  ? "bg-brand text-[#0e0a07]"
                  : "border border-border text-muted-foreground hover-fine:hover:text-foreground",
              )}
            >
              {p.label}
            </Link>
          );
        })}

        {/* Só aparece quando está activo: um chip "personalizado" permanente
         * seria um botão que não faz nada. */}
        {!range.preset && (
          <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-3.5 text-[13px] font-medium text-[#0e0a07]">
            <CalendarRange aria-hidden className="h-3.5 w-3.5" />
            {range.label}
            <Link
              href={basePath}
              aria-label="Limpar intervalo personalizado"
              className="-mr-1 ml-0.5 rounded-full p-0.5 transition-opacity duration-150 hover:opacity-70"
            >
              <X aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </span>
        )}
      </div>

      <form
        action={basePath}
        method="get"
        className="grid grid-cols-2 items-end gap-2 lg:flex"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <label
            htmlFor="range-de"
            className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            De
          </label>
          <input
            id="range-de"
            type="date"
            name="de"
            max={today}
            defaultValue={range.preset ? "" : range.fromKey}
            className="h-10 w-full min-w-0 rounded-lg border border-border bg-background px-2.5 text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label
            htmlFor="range-ate"
            className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            Até
          </label>
          <input
            id="range-ate"
            type="date"
            name="ate"
            max={today}
            defaultValue={range.preset ? "" : range.toKey}
            className="h-10 w-full min-w-0 rounded-lg border border-border bg-background px-2.5 text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>
        <button
          type="submit"
          className="col-span-2 inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 lg:col-span-1 text-[13px] font-medium text-muted-foreground transition-[background-color,color,transform] duration-150 ease-out-strong hover-fine:hover:bg-background hover-fine:hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Aplicar
        </button>
      </form>
    </section>
  );
}
