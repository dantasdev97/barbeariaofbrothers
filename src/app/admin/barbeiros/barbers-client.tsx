"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { BarberRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BarbersTable } from "./barbers-table";
import { BarberForm } from "./barber-form";

type UnitLite = { id: string; name: string; slug: string };

export function BarbersClient({
  barbers,
  units,
}: {
  barbers: BarberRow[];
  units: UnitLite[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BarberRow | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(b: BarberRow) {
    setEditing(b);
    setOpen(true);
  }

  function handleSuccess() {
    setOpen(false);
    setEditing(null);
    router.refresh();
  }

  return (
    <div>
      <header className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold leading-none tracking-tight sm:text-[32px]">
            Barbeiros
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
            {barbers.length} barbeiro{barbers.length !== 1 ? "s" : ""} · todas as unidades
          </p>
        </div>
        <Button
          onClick={openNew}
          className="w-full shrink-0 bg-brand text-primary-foreground hover:bg-brand-hover sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo barbeiro
        </Button>
      </header>

      <BarbersTable barbers={barbers} units={units} onEdit={openEdit} onAdd={openNew} />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-[560px]"
        >
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle>
              {editing ? `Editar — ${editing.name}` : "Novo barbeiro"}
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-8">
            <BarberForm
              key={editing?.id ?? "new"}
              initial={editing ?? undefined}
              units={units}
              onSuccess={handleSuccess}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
