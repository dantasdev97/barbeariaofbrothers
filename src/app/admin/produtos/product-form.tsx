"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  ProductCategoryRow,
  ProductRow,
  UnitRow,
} from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveProduct } from "@/lib/admin-actions";
import { slugify } from "@/lib/utils";

type Props = {
  initial?: ProductRow;
  units: Pick<UnitRow, "id" | "name">[];
  categories: ProductCategoryRow[];
};

export function ProductForm({ initial, units, categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [unitId, setUnitId] = useState(initial?.unit_id ?? units[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priceEuros, setPriceEuros] = useState(
    initial ? (initial.price_cents / 100).toFixed(2) : "",
  );
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seo_description ?? "");
  const [active, setActive] = useState(initial?.active ?? true);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.unit_id === unitId),
    [categories, unitId],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!unitId) return toast.error("Selecione uma unidade.");
    const cents = Math.round(Number(priceEuros) * 100);
    if (!Number.isFinite(cents) || cents < 0)
      return toast.error("Preço inválido.");

    startTransition(async () => {
      try {
        await saveProduct({
          id: initial?.id,
          unit_id: unitId,
          category_id: categoryId || null,
          name,
          slug: slug || slugify(name),
          description: description || null,
          price_cents: cents,
          image_url: imageUrl || null,
          seo_title: seoTitle || null,
          seo_description: seoDescription || null,
          active,
        });
        toast.success("Produto guardado.");
        router.push("/admin/produtos");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <fieldset className="rounded-2xl border border-white/10 bg-bg-surface p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="unit">Unidade</Label>
            <select
              id="unit"
              value={unitId}
              onChange={(e) => {
                setUnitId(e.target.value);
                setCategoryId("");
              }}
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
            <Label htmlFor="cat">Categoria</Label>
            <select
              id="cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-9 w-full rounded-md border border-white/10 bg-input px-3 text-sm"
            >
              <option value="" className="bg-bg-surface">— Sem categoria —</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id} className="bg-bg-surface">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              placeholder={slugify(name) || "ex: pomada-classica"}
              onChange={(e) => setSlug(slugify(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={description}
            rows={4}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="price">Preço (€)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              required
              value={priceEuros}
              onChange={(e) => setPriceEuros(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image">Imagem (URL)</Label>
            <Input id="image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="seo-title">SEO — Título</Label>
          <Input id="seo-title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seo-desc">SEO — Descrição</Label>
          <Textarea
            id="seo-desc"
            value={seoDescription}
            rows={3}
            onChange={(e) => setSeoDescription(e.target.value)}
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-brand"
          />
          Activo (visível na loja)
        </label>
      </fieldset>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={pending}
          size="lg"
          className="bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          {pending ? "A guardar…" : "Guardar"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
