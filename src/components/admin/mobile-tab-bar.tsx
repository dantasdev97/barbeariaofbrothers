"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useIsNative } from "@/lib/native/platform";
import { isNavActive, tabNav } from "@/components/admin/nav-items";

/**
 * Bottom tab bar nativa. Só renderiza dentro da app Capacitor
 * (no-op em web). Mostra um subconjunto curado da navegação filtrado
 * pela role e respeita a safe-area inferior (home indicator).
 */
export function MobileTabBar({ role }: { role: string }) {
  const native = useIsNative();
  const pathname = usePathname();

  if (!native) return null;

  const items = tabNav(role);
  if (items.length === 0) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      aria-label="Navegação principal"
    >
      {items.map((item) => {
        const { href, label, icon: Icon } = item;
        const active = isNavActive(item, pathname);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
              active ? "text-brand" : "text-muted-foreground",
            )}
          >
            <Icon className={cn("h-5 w-5", active && "scale-110 transition-transform")} />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
