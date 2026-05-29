"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useIsNative } from "@/lib/native/platform";
import { isNavActive, visibleNav as filterNav } from "@/components/admin/nav-items";

type Props = { email: string; role: string };

export function AdminSidebar({ email, role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const native = useIsNative();

  async function logout() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const visibleNav = filterNav(role);

  const navList = (onClick?: () => void) => (
    <nav className="flex flex-1 flex-col gap-1 px-4 py-6">
      {visibleNav.map((item) => {
        const { href, label, icon: Icon } = item;
        const active = isNavActive(item, pathname);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={cn(
              "inline-flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
              active
                ? "bg-brand text-primary-foreground shadow-lg shadow-brand/20"
                : "text-muted-foreground hover:bg-background hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Top bar (mobile) */}
      <div
        className={cn(
          "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:hidden",
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
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background transition hover:bg-muted"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* Drawer (mobile) */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-bg-surface">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Link href="/admin" className="flex items-center gap-2">
                <Image src="/logo.png" alt="" width={28} height={28} />
                <span className="font-heading text-sm font-semibold">Admin</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background transition hover:bg-muted"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {navList(() => setOpen(false))}
            <UserBlock email={email} role={role} onLogout={logout} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-[100dvh] w-72 shrink-0 flex-col border-r border-border bg-bg-surface md:flex">
        <div className="flex h-20 items-center gap-3 border-b border-border px-6">
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-full bg-brand/20 blur-lg" />
            <Image src="/logo.png" alt="" width={40} height={40} className="relative z-10" />
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
        {navList()}
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
    <div className="mt-auto border-t border-border p-5">
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
