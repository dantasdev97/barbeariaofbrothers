"use client";

import { useMemo, useState, useTransition } from "react";
import { Package, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ProductRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { deleteProduct } from "@/lib/admin-actions";
import { staggerIndex } from "@/lib/motion";
import { formatPrice, cn } from "@/lib/utils";

type UnitLite = { id: string; name: string; slug: string };
type Filter = "all" | "featured" | "out";

function isOut(p: ProductRow) {
  return p.out_of_stock || p.stock === 0;
}
function discountPct(p: ProductRow) {
  if (p.compare_at_price_cents != null && p.compare_at_price_cents > p.price_cents) {
    return Math.round(((p.compare_at_price_cents - p.price_cents) / p.compare_at_price_cents) * 100);
  }
  return null;
}

function PriceCell({ p }: { p: ProductRow }) {
  const pct = discountPct(p);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {pct != null && (
        <s className="text-xs text-muted-foreground">{formatPrice(p.compare_at_price_cents!)}</s>
      )}
      <span className="font-semibold text-brand">{formatPrice(p.price_cents)}</span>
      {pct != null && (
        <Badge variant="secondary" className="bg-emerald-500/15 px-1.5 text-[10px] font-semibold text-emerald-600">
          −{pct}%
        </Badge>
      )}
    </span>
  );
}

function StatusBadge({ p }: { p: ProductRow }) {
  if (!p.active) return <Badge variant="secondary">Inactivo</Badge>;
  if (isOut(p))
    return (
      <Badge variant="secondary" className="bg-destructive/10 text-destructive">
        Esgotado
      </Badge>
    );
  return <Badge variant="default" className="bg-brand/15 text-brand">Disponível</Badge>;
}

export function ProductsTable({
  products,
  units,
  onEdit,
  onAdd,
}: {
  products: ProductRow[];
  units: UnitLite[];
  onEdit?: (p: ProductRow) => void;
  onAdd?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<ProductRow | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const unitsById = new Map(units.map((u) => [u.id, u]));

  const counts = useMemo(
    () => ({
      all: products.length,
      featured: products.filter((p) => p.featured).length,
      out: products.filter(isOut).length,
    }),
    [products],
  );
  const visible = useMemo(
    () =>
      products.filter((p) =>
        filter === "featured" ? p.featured : filter === "out" ? isOut(p) : true,
      ),
    [products, filter],
  );

  function confirmDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      try {
        await deleteProduct(toDelete.id, toDelete.unit_id);
        toast.success("Produto eliminado.");
        setToDelete(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-6 w-6" />}
        title="Sem produtos ainda"
        description="Adicione o primeiro produto ao catálogo."
        action={
          <Button
            className="bg-brand text-primary-foreground hover:bg-brand-hover"
            onClick={onAdd}
          >
            Adicionar produto
          </Button>
        }
      />
    );
  }

  const chips: { id: Filter; label: string; n: number }[] = [
    { id: "all", label: "Todos", n: counts.all },
    { id: "featured", label: "Em destaque", n: counts.featured },
    { id: "out", label: "Esgotado", n: counts.out },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            aria-pressed={filter === c.id}
            className={cn(
              "min-h-9 rounded-full border px-4 text-xs font-medium",
              "transition-[background-color,border-color,color,transform] duration-150 ease-out-strong active:scale-[0.96]",
              filter === c.id
                ? "border-brand bg-brand text-primary-foreground"
                : "border-border bg-bg-surface text-muted-foreground hover-fine:hover:bg-background hover-fine:hover:text-foreground",
            )}
          >
            {c.label} · {c.n}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Nenhum produto neste filtro"
          description="Não há produtos que correspondam ao filtro seleccionado."
          action={
            <Button variant="secondary" onClick={() => setFilter("all")}>
              Ver todos os produtos
            </Button>
          }
        />
      )}

      {/* Mobile cards */}
      <div className="stagger space-y-3 md:hidden">
        {visible.map((p, i) => (
          <article key={p.id} {...staggerIndex(i)} className="rounded-xl border border-border bg-bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="flex items-center gap-1.5 truncate font-heading text-lg font-semibold">
                  {p.featured && <Star className="h-4 w-4 shrink-0 fill-brand text-brand" />}
                  {p.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {unitsById.get(p.unit_id)?.name ?? "—"}
                </p>
              </div>
              <StatusBadge p={p} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <PriceCell p={p} />
              <span className="text-xs text-muted-foreground">Stock: {p.stock}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" onClick={() => onEdit?.(p)}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setToDelete(p)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Eliminar
              </Button>
            </div>
          </article>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-bg-surface md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-4 text-left font-medium">Produto</th>
              <th className="hidden px-5 py-4 text-left font-medium lg:table-cell">Unidade</th>
              <th className="px-5 py-4 text-left font-medium">Preço</th>
              <th className="px-5 py-4 text-left font-medium">Stock</th>
              <th className="px-5 py-4 text-left font-medium">Estado</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="stagger divide-y divide-border">
            {visible.map((p, i) => (
              <tr
                key={p.id}
                {...staggerIndex(i)}
                className="transition-colors duration-150 hover-fine:hover:bg-background"
              >
                <td className="px-5 py-4 font-medium">
                  <span className="flex items-center gap-1.5">
                    {p.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-brand text-brand" />}
                    {p.name}
                  </span>
                </td>
                <td className="hidden px-5 py-4 text-muted-foreground lg:table-cell">
                  {unitsById.get(p.unit_id)?.name ?? "—"}
                </td>
                <td className="px-5 py-4">
                  <PriceCell p={p} />
                </td>
                <td className={cn("px-5 py-4", isOut(p) ? "font-medium text-destructive" : "text-muted-foreground")}>
                  {p.stock}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge p={p} />
                </td>
                <td className="px-3 py-4 text-right sm:px-5">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onEdit?.(p)} aria-label="Editar">
                      <Pencil className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setToDelete(p)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => { if (!open) setToDelete(null); }}
        title="Eliminar produto"
        description={`Tem a certeza que pretende eliminar "${toDelete?.name}"? Esta acção não pode ser revertida.`}
        onConfirm={confirmDelete}
        loading={pending}
      />
    </>
  );
}
