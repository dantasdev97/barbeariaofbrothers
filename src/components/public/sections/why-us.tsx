import { Award, CalendarCheck, Package, Scissors } from "lucide-react";
import { getServerI18n } from "@/lib/i18n/server";

/** Os ícones são posicionalmente acoplados a `t.whyUs.features`. */
const ICONS = [Award, Scissors, CalendarCheck, Package];

/**
 * Bloco "Porquê nós" — 4 cartões de argumentos.
 *
 * Extraído da página de unidade para ser partilhado com a homepage. Não depende
 * de nenhuma unidade.
 */
export async function WhyUs() {
  const { dict: t } = await getServerI18n();

  return (
    <section className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
            {t.whyUs.eyebrow}
          </p>
          <h2 className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {t.whyUs.titleLine1}
            <br />
            {t.whyUs.titleLine2}
          </h2>
          <p className="mt-4 text-[17px] text-muted-foreground">
            {t.whyUs.subtitle}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ICONS.map((Icon, i) => {
            const { title, desc } = t.whyUs.features[i];
            return (
              <div
                key={title}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[0_16px_40px_-16px_rgba(243,146,0,0.15)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="font-heading text-lg font-semibold leading-snug">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
