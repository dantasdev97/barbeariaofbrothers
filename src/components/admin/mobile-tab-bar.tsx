"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isNavActive, tabNav } from "@/components/admin/nav-items";

/**
 * Bottom tab bar do admin.
 *
 * Visível em todo o mobile — web e app Capacitor. No desktop desaparece
 * (`md:hidden`) e a navegação passa a ser a sidebar.
 *
 * O indicador activo desliza com `transform` em CSS, não com layout
 * animations do Framer Motion. É deliberado: a barra anima exactamente
 * quando o utilizador navega, ou seja, quando a main thread está ocupada a
 * carregar a página nova — é aí que animação em JS perde frames. Em CSS
 * corre no compositor e mantém-se fluida.
 */
export function MobileTabBar({ role }: { role: string }) {
  const pathname = usePathname();
  const items = tabNav(role);

  if (items.length === 0) return null;

  const activeIndex = items.findIndex((item) => isNavActive(item, pathname));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-surface/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Navegação principal"
    >
      <div className="relative flex items-stretch">
        {/* Indicador deslizante. Só existe quando há aba activa, senão
         * apareceria encostado à esquerda sem significado nenhum. */}
        {activeIndex >= 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 transition-transform duration-[260ms] ease-out-strong"
            style={{
              width: `${100 / items.length}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          >
            <div className="absolute inset-x-0 top-0 mx-auto h-0.5 w-10 rounded-full bg-brand" />
            <div className="absolute inset-x-0 top-0 mx-auto h-8 w-16 rounded-full bg-brand/12 blur-xl" />
          </div>
        )}

        {items.map((item) => {
          const { href, label, icon: Icon } = item;
          const active = isNavActive(item, pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 py-2",
                "transition-[transform,color] duration-150 ease-out-strong active:scale-[0.92]",
                active ? "text-brand" : "text-muted-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-[22px] w-[22px] transition-transform duration-[260ms] ease-out-strong",
                  active && "scale-110",
                )}
              />
              {/* Peso da fonte fixo de propósito: alternar para semibold
               * mudaria a largura do label e provocava um salto a cada
               * navegação. O estado activo lê-se pela cor e pelo ícone. */}
              <span className="truncate text-[10px] font-medium leading-none">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
