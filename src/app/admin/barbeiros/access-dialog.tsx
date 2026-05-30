"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/admin/form-bits";
import { createBarberAccess, createStaffUser } from "@/lib/staff-actions";
import type { ProfileRole } from "@/types/database.types";

type UnitLite = { id: string; name: string; slug: string };

export type AccessTarget =
  | { mode: "barber"; barberId: string; barberName: string }
  | { mode: "staff" };

const ROLE_LABEL: Record<"manager" | "super_admin", string> = {
  manager: "Gestor (manager)",
  super_admin: "Administrador (dono)",
};

export function AccessDialog({
  target,
  units,
  onClose,
  onDone,
}: {
  target: AccessTarget | null;
  units: UnitLite[];
  onClose: () => void;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [role, setRole] = useState<"manager" | "super_admin">("manager");
  const [unitId, setUnitId] = useState<string>(units[0]?.id ?? "");

  const open = target !== null;
  const isStaff = target?.mode === "staff";

  function reset() {
    setEmail("");
    setPassword("");
    setShow(false);
    setRole("manager");
    setUnitId(units[0]?.id ?? "");
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
      onClose();
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    startTransition(async () => {
      try {
        if (target.mode === "barber") {
          await createBarberAccess(target.barberId, email, password);
        } else {
          await createStaffUser({
            email,
            password,
            role,
            unitId: role === "super_admin" ? null : unitId || null,
          });
        }
        toast.success("Acesso criado com sucesso.");
        reset();
        onDone();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falhou criar o acesso.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {target?.mode === "barber"
              ? `Criar acesso — ${target.barberName}`
              : "Criar acesso de gestão"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <p className="rounded-lg bg-bg-surface p-3 text-xs text-muted-foreground">
            {target?.mode === "barber"
              ? "O barbeiro vai entrar com este email e password e ver apenas a Operação (scanner + pontos)."
              : "Define o nível de acesso. O administrador vê tudo; o gestor gere a sua unidade."}
          </p>

          {isStaff && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="role" label="Nível de acesso *">
                <Select
                  value={role}
                  onValueChange={(v) => setRole((v as "manager" | "super_admin") ?? "manager")}
                >
                  <SelectTrigger id="role">
                    <SelectValue>
                      {(v: string) => ROLE_LABEL[(v as "manager" | "super_admin")] ?? ""}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">{ROLE_LABEL.manager}</SelectItem>
                    <SelectItem value="super_admin">{ROLE_LABEL.super_admin}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {role === "manager" && (
                <Field id="unit" label="Unidade *">
                  <Select value={unitId} onValueChange={(v) => setUnitId(v ?? "")}>
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Selecionar unidade">
                        {(v: string) => units.find((u) => u.id === v)?.name ?? ""}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </div>
          )}

          <Field id="email" label="Email *">
            <Input
              id="email"
              type="email"
              autoComplete="off"
              value={email}
              placeholder="barbeiro@exemplo.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field id="password" label="Password *" hint="Mínimo 8 caracteres. Partilha-a com a pessoa.">
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                placeholder="••••••••"
                className="pr-10"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={show ? "Esconder password" : "Mostrar password"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending || !email.trim() || password.length < 8}
              className="bg-brand text-primary-foreground hover:bg-brand-hover"
            >
              {isStaff ? (
                <ShieldCheck className="mr-2 h-4 w-4" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              {pending ? "A criar…" : "Criar acesso"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
