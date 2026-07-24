"use client";

import { useState, useTransition } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ProductCategoryRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
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
  const [toDelete, setToDelete] = useState<ProductCategoryRow | null>(null);

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

  function confirmDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      try {
        await deleteCategory(toDelete.id, toDelete.unit_id);
        toast.success("Categoria eliminada.");
        setToDelete(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Add form */}
        <form
          onSubmit={add}
          className="space-y-4 rounded-2xl border border-border bg-bg-surface p-6"
        >
          <h3 className="font-heading text-lg font-semibold">Nova categoria</h3>

          <div className="space-y-1.5">
            <Label htmlFor="cat-unit">Unidade</Label>
            <select
              id="cat-unit"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground transition-[box-shadow,border-color] duration-150 ease-out-strong focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id} className="bg-background">
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
            <Label htmlFor="cat-order">Ordem de exibição</Label>
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

        {/* Categories list */}
        <div className="rounded-2xl border border-border bg-bg-surface p-6">
          <h3 className="mb-5 font-heading text-lg font-semibold">
            Categorias da unidade
          </h3>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background">
                <Tag className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhuma categoria para esta unidade ainda.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between py-3.5 transition-colors duration-150 hover-fine:hover:bg-background/50 -mx-2 px-2 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <code className="rounded bg-background px-1.5 py-0.5 font-mono">
                        /{c.slug}
                      </code>
                      {" · "}ordem {c.display_order}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => setToDelete(c)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Eliminar ${c.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => { if (!open) setToDelete(null); }}
        title="Eliminar categoria"
        description={`Tem a certeza que pretende eliminar a categoria "${toDelete?.name}"? Os produtos associados perderão esta categoria.`}
        onConfirm={confirmDelete}
        loading={pending}
      />
    </>
  );
}
