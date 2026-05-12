"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { UnitRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UnitsTable } from "./units-table";
import { UnitForm } from "./unit-form";

export function UnitsClient({ units }: { units: UnitRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UnitRow | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(u: UnitRow) {
    setEditing(u);
    setOpen(true);
  }

  function handleSuccess() {
    setOpen(false);
    setEditing(null);
    router.refresh();
  }

  return (
    <div>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-[28px] font-semibold leading-none tracking-tight sm:text-[32px]">
            Unidades
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {units.length} barbearia{units.length !== 1 ? "s" : ""} · gerir localizações
          </p>
        </div>
        <Button
          onClick={openNew}
          className="shrink-0 bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova unidade
        </Button>
      </header>

      <UnitsTable units={units} onEdit={openEdit} onAdd={openNew} />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="overflow-y-auto"
          style={{ width: "min(560px, 95vw)" }}
        >
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle>
              {editing ? `Editar — ${editing.name}` : "Nova unidade"}
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-8">
            <UnitForm
              key={editing?.id ?? "new"}
              initial={editing ?? undefined}
              onSuccess={handleSuccess}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
