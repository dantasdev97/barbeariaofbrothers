import { getServerI18n } from "@/lib/i18n/server";

/**
 * Banda horizontal com os serviços em movimento.
 *
 * Extraída da página de unidade para ser partilhada com a homepage. Não depende
 * de nenhuma unidade — lê só o dicionário. Os keyframes `marquee` vivem em
 * `src/app/globals.css`.
 */
export async function MarqueeBand() {
  const { dict: t } = await getServerI18n();

  return (
    <div className="relative overflow-hidden bg-foreground py-5">
      <div
        className="flex w-max gap-12"
        style={{ animation: "marquee 30s linear infinite" }}
      >
        {[...t.marquee, ...t.marquee].map((item, i) => (
          <div key={i} className="flex items-center gap-12">
            <span className="font-heading text-[22px] font-medium tracking-wide text-background">
              {item}
            </span>
            <span className="text-brand">●</span>
          </div>
        ))}
      </div>
    </div>
  );
}
