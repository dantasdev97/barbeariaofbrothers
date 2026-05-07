"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Scissors } from "lucide-react";
import type { UnitRow } from "@/types/database.types";
import { useUnidade } from "@/hooks/useUnidade";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  units: UnitRow[];
};

export function UnitPicker({ units }: Props) {
  const router = useRouter();
  const setSlug = useUnidade((s) => s.setSlug);
  const [selected, setSelected] = useState<string | null>(null);

  function pick(slug: string) {
    setSelected(slug);
    setSlug(slug);
    // tiny delay so the user sees feedback
    setTimeout(() => router.push(`/${slug}`), 220);
  }

  return (
    <div className="relative isolate min-h-[100dvh] overflow-hidden bg-background">
      <div className="bg-grid absolute inset-0 -z-10 opacity-40" />
      <div className="absolute -top-40 left-1/2 -z-10 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" />

      <div className="container-page flex min-h-[100dvh] flex-col items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
            <Scissors className="h-3.5 w-3.5 text-brand" />
            <span>Since 2012</span>
          </div>

          <Image
            src="/logo.png"
            alt="Barbearia Of Brothers"
            width={240}
            height={180}
            priority
            className="mb-6 h-auto w-44 sm:w-56"
          />

          <h1 className="font-heading text-4xl font-semibold leading-tight sm:text-5xl">
            Bem-vindo à <span className="text-gradient-brand">Of Brothers</span>
          </h1>
          <p className="mt-3 max-w-lg text-balance text-sm text-muted-foreground sm:text-base">
            Escolha a sua barbearia para começar. Pode trocar de unidade a
            qualquer momento.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-2"
        >
          {units.length === 0 && (
            <div className="col-span-full rounded-2xl border border-white/10 bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhuma unidade configurada ainda. Entre no painel admin para
              adicionar.
            </div>
          )}

          {units.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => pick(u.slug)}
              className={cn(
                "group relative flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-card p-6 text-left transition",
                "hover:-translate-y-1 hover:border-brand/40 hover:shadow-premium-lg",
                selected === u.slug && "border-brand/60 ring-2 ring-brand/40",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-heading text-xl font-semibold text-foreground">
                  {u.name}
                </span>
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                  {u.slug}
                </span>
              </div>
              {u.address && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 text-brand" />
                  <span className="truncate">{u.address}</span>
                </div>
              )}
              <div className="mt-3 inline-flex items-center text-sm font-medium text-brand transition group-hover:translate-x-0.5">
                Entrar →
              </div>
            </button>
          ))}
        </motion.div>

        {units.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 text-xs text-muted-foreground"
          >
            A sua escolha ficará guardada neste dispositivo.
          </motion.p>
        )}

        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mt-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Link href="/login">Acesso administrativo</Link>
        </Button>
      </div>
    </div>
  );
}
