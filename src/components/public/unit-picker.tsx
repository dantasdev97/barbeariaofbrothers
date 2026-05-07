"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { UnitRow } from "@/types/database.types";
import { useUnidade } from "@/hooks/useUnidade";
import { cn } from "@/lib/utils";

type Props = { units: UnitRow[] };

const UNIT_GRADIENTS = [
  "linear-gradient(135deg, #1a1410 60%, #3a302a)",
  "linear-gradient(135deg, #1a1410 60%, #F39200)",
  "linear-gradient(135deg, #1a1a2e 60%, #16213e)",
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UnitPicker({ units }: Props) {
  const router = useRouter();
  const setSlug = useUnidade((s) => s.setSlug);
  const [selected, setSelected] = useState<string | null>(null);

  function pick(slug: string) {
    setSelected(slug);
    setSlug(slug);
    setTimeout(() => router.push(`/${slug}`), 220);
  }

  return (
    <div className="relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="bg-grid absolute inset-0 -z-10 opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-bg-surface p-8 shadow-premium-lg sm:p-12"
      >
        {/* Ambient radial glows */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 0% 0%, rgba(243,146,0,0.08), transparent 40%), radial-gradient(circle at 100% 100%, rgba(243,146,0,0.05), transparent 40%)",
          }}
        />

        {/* Header */}
        <div className="relative text-center">
          <Image
            src="/logo.png"
            alt="Barbearia Of Brothers"
            width={220}
            height={165}
            priority
            className="mx-auto mb-6 h-auto w-32 sm:w-40"
          />
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
            Bem-vindo à Barbearia Brothers
          </p>
          <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Escolhe a tua unidade
          </h1>
          <p className="mx-auto mt-3 max-w-[480px] text-balance text-sm text-muted-foreground sm:text-[15px]">
            Cada unidade tem a sua equipa e os seus produtos. Esta escolha fica
            guardada para a próxima visita.
          </p>
        </div>

        {/* Unit cards grid */}
        <div className="relative mt-8 grid gap-4 sm:grid-cols-2">
          {units.length === 0 && (
            <div className="col-span-full rounded-xl border border-white/10 bg-background p-8 text-center text-sm text-muted-foreground">
              Nenhuma unidade configurada. Entre no painel admin para adicionar.
            </div>
          )}

          {units.map((u, i) => {
            const gradient = UNIT_GRADIENTS[i % UNIT_GRADIENTS.length];
            const initials = getInitials(u.name);
            const city = u.address?.split(",").pop()?.trim() ?? "Leiria";

            return (
              <button
                key={u.id}
                type="button"
                onClick={() => pick(u.slug)}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200",
                  "border-white/10 bg-background hover:-translate-y-1 hover:border-brand/40",
                  "hover:shadow-[0_18px_40px_-20px_rgba(243,146,0,0.35)]",
                  selected === u.slug && "border-brand/50 ring-2 ring-brand/30",
                )}
              >
                {/* Gradient image section with initials */}
                <div
                  className="relative flex h-[140px] items-center justify-center overflow-hidden"
                  style={{ background: gradient }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent 0 12px, rgba(255,255,255,0.06) 12px 13px)",
                    }}
                  />
                  <span className="relative font-heading text-[64px] font-bold tracking-tighter text-white/90">
                    {initials}
                  </span>
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col p-5">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                    ● {city}
                  </p>
                  <h3 className="font-heading text-xl font-semibold tracking-tight">
                    {u.name}
                  </h3>
                  {u.address && (
                    <p className="mt-1 line-clamp-1 text-[14px] text-muted-foreground">
                      {u.address}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4 text-sm font-medium">
                    <span>Entrar nesta unidade</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
          <span>Desde 2012</span>
          <span className="text-white/20">·</span>
          <span>2 unidades em Leiria</span>
          <span className="text-white/20">·</span>
          <span>Agendamento online</span>
        </div>
        <div className="relative mt-3 text-center">
          <Link
            href="/login"
            className="text-xs text-muted-foreground/60 transition-colors hover:text-brand"
          >
            Acesso administrativo
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
