"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useIsNative } from "@/lib/native/platform";
import {
  isNavActive,
  type NavItem,
  visibleNav as filterNav,
} from "@/components/admin/nav-items";

type Props = { email: string; role: string };

export function AdminSidebar({ email, role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const native = useIsNative();

  // Escape fecha; enquanto aberta, o body não faz scroll por baixo.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const visibleNav = filterNav(role);
  // No mobile, os 4 destinos principais já estão na tab bar inferior — a
  // gaveta serve o resto. No desktop mostra tudo, que é a única navegação.
  const primary = visibleNav.filter((i) => i.tab);
  const secondary = visibleNav.filter((i) => !i.tab);

  const navLink = (item: NavItem, onClick?: () => void) => {
    const { href, label, icon: Icon } = item;
    const active = isNavActive(item, pathname);
    return (
      <Link
        key={href}
        href={href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group inline-flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium",
          "transition-[background-color,color,transform] duration-200 ease-out-strong",
          "active:scale-[0.98]",
          active
            ? "bg-brand text-primary-foreground shadow-lg shadow-brand/20"
            : "text-muted-foreground hover:bg-background hover:text-foreground",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200 ease-out-strong",
            // Hover só em ponteiros finos: no telemóvel o toque dispara
            // hover e o ícone ficava deslocado depois do tap.
            !active && "hover-fine:group-hover:translate-x-0.5",
          )}
        />
        {label}
      </Link>
    );
  };

  const groupLabel = (text: string) => (
    <p className="px-4 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">
      {text}
    </p>
  );

  return (
    <>
      {/* Top bar (mobile) */}
      <div
        className={cn(
          "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl md:hidden",
          native && "pt-[env(safe-area-inset-top)] box-content",
        )}
      >
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={28} height={28} />
          <span className="font-heading text-sm font-semibold">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-[background-color,transform] duration-150 ease-out-strong hover:bg-muted hover:text-foreground active:scale-[0.92]"
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>
      </div>

      {/* Gaveta (mobile).
       * Fica sempre montada para que a saída também anime — desmontar
       * cortava a animação de fecho a meio. `invisible` tira-a das
       * interacções e da árvore de acessibilidade quando fechada. */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          open ? "visible" : "invisible delay-300",
        )}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ease-out-strong",
            open ? "opacity-100 duration-300" : "opacity-0 duration-200",
          )}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-bg-surface",
            "transition-transform ease-drawer will-change-transform",
            // Sair é mais rápido do que entrar: o utilizador já decidiu.
            open ? "translate-x-0 duration-300" : "-translate-x-full duration-200",
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
            {/* Cada destino dentro da gaveta fecha-a explicitamente — é o que
             * evita ter de a sincronizar com o pathname num efeito. */}
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2"
            >
              <Image src="/logo.png" alt="" width={28} height={28} />
              <span className="font-heading text-sm font-semibold">Admin</span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-[background-color,transform] duration-150 ease-out-strong hover:bg-muted hover:text-foreground active:scale-[0.92]"
              aria-label="Fechar"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 pb-4">
            {secondary.length > 0 && groupLabel("Gerir")}
            <div className="flex flex-col gap-1">
              {secondary.map((item) => navLink(item, () => setOpen(false)))}
            </div>
            {primary.length > 0 && (
              <>
                {groupLabel("Atalhos")}
                <div className="flex flex-col gap-1">
                  {primary.map((item) => navLink(item, () => setOpen(false)))}
                </div>
              </>
            )}
          </nav>

          <UserBlock email={email} role={role} onLogout={logout} />
        </aside>
      </div>

      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-[100dvh] w-72 shrink-0 flex-col border-r border-border bg-bg-surface md:flex">
        <div className="flex h-20 shrink-0 items-center gap-3 border-b border-border px-6">
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-full bg-brand/20 blur-lg" />
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              className="relative z-10"
            />
          </div>
          <div>
            <p className="font-heading text-base font-bold leading-tight">
              Of Brothers
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand/70">
              Admin
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="flex flex-col gap-1 pt-4">
            {primary.map((item) => navLink(item))}
          </div>
          {secondary.length > 0 && (
            <>
              {groupLabel("Gerir")}
              <div className="flex flex-col gap-1">
                {secondary.map((item) => navLink(item))}
              </div>
            </>
          )}
        </nav>

        <UserBlock email={email} role={role} onLogout={logout} />
      </aside>
    </>
  );
}

function UserBlock({
  email,
  role,
  onLogout,
}: {
  email: string;
  role: string;
  onLogout: () => void;
}) {
  return (
    <div className="mt-auto shrink-0 border-t border-border p-5">
      <div className="mb-4 rounded-lg bg-background p-4">
        <p className="truncate text-sm font-semibold">{email}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-brand/70">
          {role}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLogout}
        className="w-full justify-start text-muted-foreground hover:bg-background hover:text-foreground"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>
    </div>
  );
}
