"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ProductCategoryRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveCategory, deleteCategory } from "@/lib/admin-actions";
import { slugify } from "@/lib/utils";
import { useRouter } from "next/navigation";

type UnitLite = { id: string; name: string };

export function CategoriesManager({
  initialCategories,
  units,
}: {
  initialCategories: ProductCategoryRow[];
  units: UnitLite[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState(0);

  const filtered = initialCategories.filter((c) => c.unit_id === unitId);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!unitId || !name) return;
    startTransition(async () => {
      try {
        await saveCategory({
          unit_id: unitId,
          name,
          slug: slug || slugify(name),
          display_order: order,
        });
        toast.success("Categoria criada.");
        setName("");
        setSlug("");
        setOrder(0);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  function remove(c: ProductCategoryRow) {
    if (!confirm(`Eliminar categoria "${c.name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteCategory(c.id, c.unit_id);
        toast.success("Eliminada.");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form
        onSubmit={add}
        className="rounded-2xl border border-white/10 bg-bg-surface p-6 space-y-4"
      >
        <h3 className="font-heading text-lg font-semibold">Adicionar</h3>
        <div className="space-y-1.5">
          <Label htmlFor="cat-unit">Unidade</Label>
          <select
            id="cat-unit"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="h-9 w-full rounded-md border border-white/10 bg-input px-3 text-sm"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id} className="bg-bg-surface">
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-name">Nome</Label>
          <Input
            id="cat-name"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-slug">Slug</Label>
          <Input
            id="cat-slug"
            value={slug}
            placeholder={slugify(name) || "ex: cabelo"}
            onChange={(e) => setSlug(slugify(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-order">Ordem</Label>
          <Input
            id="cat-order"
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
          />
        </div>
        <Button
          type="submit"
          disabled={pending}
          className="w-full bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </form>

      <div className="rounded-2xl border border-white/10 bg-bg-surface p-6">
        <h3 className="mb-4 font-heading text-lg font-semibold">
          Categorias da unidade
        </h3>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma ainda.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {filtered.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /{c.slug} · ordem {c.display_order}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => remove(c)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
