"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClientLite = {
  id: string;
  name: string;
  phone: string;
  qr_token: string;
  unit_id: string;
};
type UnitLite = { id: string; name: string; slug: string };

export function CardsExport({
  clients,
  units,
}: {
  clients: ClientLite[];
  units: UnitLite[];
}) {
  const [unitFilter, setUnitFilter] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return clients.filter((c) => {
      if (unitFilter && c.unit_id !== unitFilter) return false;
      if (!term) return true;
      return (
        c.name.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term)
      );
    });
  }, [clients, unitFilter, q]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((c) => next.add(c.id));
      return next;
    });
  }

  function clear() {
    setSelected(new Set());
  }

  function openPrintSheet() {
    if (selected.size === 0) return toast.error("Selecione pelo menos um cliente.");
    startTransition(async () => {
      const ids = Array.from(selected).join(",");
      const w = window.open(`/api/loyalty/print-cards?ids=${ids}`, "_blank");
      if (!w) toast.error("Permite popups para imprimir.");
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">Todas as unidades</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar nome ou telefone…"
          className="max-w-sm"
        />
        <Button variant="outline" onClick={selectAllVisible}>
          Selecionar todos ({filtered.length})
        </Button>
        <Button variant="ghost" onClick={clear}>
          Limpar
        </Button>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {selected.size} selecionado{selected.size !== 1 ? "s" : ""}
          </span>
          <Button
            onClick={openPrintSheet}
            disabled={pending || selected.size === 0}
            className="bg-brand text-primary-foreground hover:bg-brand-hover"
          >
            <Printer className="mr-2 h-4 w-4" />
            Abrir folha de impressão
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-bg-surface">
        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            Nenhum cliente.
          </p>
        ) : (
          filtered.map((c) => {
            const checked = selected.has(c.id);
            return (
              <label
                key={c.id}
                className={`grid cursor-pointer gap-2 border-b border-border px-4 py-3 text-sm transition hover:bg-background sm:px-6 sm:grid-cols-[auto_2fr_1.4fr_1fr] sm:items-center sm:gap-3 ${
                  checked ? "bg-background" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(c.id)}
                  className="h-4 w-4 accent-[color:var(--color-brand,#C9A84C)]"
                />
                <div className="font-medium">{c.name}</div>
                <div className="font-mono text-[12.5px] text-muted-foreground">
                  {c.phone}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {c.qr_token}
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
