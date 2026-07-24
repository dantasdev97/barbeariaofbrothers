"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldCheck } from "lucide-react";
import type { BarberRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarbersTable } from "./barbers-table";
import { BarberForm } from "./barber-form";
import { AccessDialog, type AccessTarget } from "./access-dialog";

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
  const [access, setAccess] = useState<AccessTarget | null>(null);

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
      <PageHeader
        title="Barbeiros"
        description={`${barbers.length} barbeiro${
          barbers.length !== 1 ? "s" : ""
        } · todas as unidades`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setAccess({ mode: "staff" })}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Criar acesso de gestão
            </Button>
            <Button
              onClick={openNew}
              className="bg-brand text-primary-foreground hover:bg-brand-hover"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo barbeiro
            </Button>
          </>
        }
      />

      <BarbersTable
        barbers={barbers}
        units={units}
        onEdit={openEdit}
        onAdd={openNew}
        onCreateAccess={(b) =>
          setAccess({ mode: "barber", barberId: b.id, barberName: b.name })
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Editar — ${editing.name}` : "Novo barbeiro"}
            </DialogTitle>
          </DialogHeader>
          <BarberForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            units={units}
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>

      <AccessDialog
        target={access}
        units={units}
        onClose={() => setAccess(null)}
        onDone={() => setAccess(null)}
      />
    </div>
  );
}
