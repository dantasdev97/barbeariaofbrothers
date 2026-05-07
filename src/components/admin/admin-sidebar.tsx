"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Scissors,
  Settings,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/barbeiros", label: "Barbeiros", icon: Scissors },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: Tag },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

type Props = { email: string; role: string };

export function AdminSidebar({ email, role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navList = (onClick?: () => void) => (
    <nav className="flex flex-1 flex-col gap-2 px-4 py-6">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={cn(
              "inline-flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
              active
                ? "bg-brand text-primary-foreground shadow-lg shadow-brand/20"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Top bar (mobile) */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-background/90 px-4 backdrop-blur md:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={28} height={28} />
          <span className="font-heading text-sm font-semibold">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5"
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
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-white/10 bg-bg-surface">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <Link href="/admin" className="flex items-center gap-2">
                <Image src="/logo.png" alt="" width={28} height={28} />
                <span className="font-heading text-sm font-semibold">Admin</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5"
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
      <aside className="sticky top-0 hidden h-[100dvh] w-72 shrink-0 flex-col border-r border-white/10 bg-bg-surface md:flex">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-brand/20 blur-lg rounded-full" />
            <Image src="/logo.png" alt="" width={40} height={40} className="relative z-10" />
          </div>
          <div>
            <p className="font-heading text-base font-bold leading-tight">
              Of Brothers
            </p>
            <p className="text-[10px] uppercase tracking-wider text-brand/70 font-semibold">
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
    <div className="border-t border-white/10 p-5 mt-auto">
      <div className="rounded-lg bg-white/5 p-4 mb-4">
        <p className="truncate text-sm font-semibold">{email}</p>
        <p className="text-[10px] uppercase tracking-wider text-brand/70 font-semibold mt-1">
          {role}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLogout}
        className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-white/5"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>
    </div>
  );
}
