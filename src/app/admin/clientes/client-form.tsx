"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Section } from "@/components/admin/form-bits";
import { saveClient } from "@/lib/loyalty/actions";
import type { ClientRow, UnitRow } from "@/types/database.types";

type UnitLite = Pick<UnitRow, "id" | "name" | "slug">;

export function ClientForm({
  units,
  defaultUnitId,
  initial,
}: {
  units: UnitLite[];
  defaultUnitId: string;
  initial?: ClientRow;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Default: ao cadastrar, todas as unidades marcadas (cliente é global,
  // saldo separado por unidade). Ao editar, mantém a unidade primária.
  const initialUnits = initial
    ? [initial.unit_id]
    : units.map((u) => u.id);
  const [unitIds, setUnitIds] = useState<string[]>(initialUnits);
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  // Garantir que o "defaultUnitId" do server fica a primeira escolha quando faz sentido
  const orderedUnits = [...units].sort((a, b) =>
    a.id === defaultUnitId ? -1 : b.id === defaultUnitId ? 1 : 0,
  );

  function toggleUnit(id: string) {
    setUnitIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Indique o nome do cliente.");
    if (!phone.trim()) return toast.error("Indique o telefone.");
    if (unitIds.length === 0) return toast.error("Selecione pelo menos uma unidade.");

    // Unidade primária = primeira selecionada na ordem mostrada
    const primaryUnitId =
      orderedUnits.find((u) => unitIds.includes(u.id))?.id ?? unitIds[0];

    startTransition(async () => {
      try {
        const { id } = await saveClient({
          id: initial?.id,
          unit_id: primaryUnitId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          notes: notes.trim() || null,
        });
        toast.success(initial ? "Cliente atualizado." : "Cliente cadastrado.");
        router.push(`/admin/clientes/${id}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falhou.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Section title="Dados do cliente">
        <Field id="name" label="Nome *">
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="João Silva"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="phone" label="Telefone *" hint="Único — usado como identificador">
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+351 912 345 678"
              inputMode="tel"
            />
          </Field>
          <Field id="email" label="Email (opcional)">
            <Input
              id="email"
              type="email"
              value={email ?? ""}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@exemplo.pt"
            />
          </Field>
        </div>
        <Field
          label="Unidades onde acumula pontos *"
          hint="O cliente é global — pode usar o cartão em qualquer unidade marcada. O saldo de pontos é calculado por unidade independentemente."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {orderedUnits.map((u) => {
              const checked = unitIds.includes(u.id);
              return (
                <label
                  key={u.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition ${
                    checked
                      ? "border-brand bg-brand/5"
                      : "border-border bg-background hover:border-brand/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUnit(u.id)}
                    className="h-4 w-4 accent-[color:var(--color-brand,#C9A84C)]"
                  />
                  <span className="font-medium">{u.name}</span>
                </label>
              );
            })}
          </div>
        </Field>
        <Field id="notes" label="Notas internas (opcional)">
          <Textarea
            id="notes"
            value={notes ?? ""}
            rows={2}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Preferências, alergias, etc."
          />
        </Field>
      </Section>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={pending}
          className="bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          {pending ? "A guardar…" : initial ? "Guardar alterações" : "Cadastrar e gerar QR"}
        </Button>
      </div>
    </form>
  );
}
