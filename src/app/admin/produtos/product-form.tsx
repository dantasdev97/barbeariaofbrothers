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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <form onSubmit={onSubmit} className="max-w-3xl space-y-5">
      {/* Classificação */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-bg-surface p-6">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Classificação
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="unit">Unidade</Label>
            <Select
              value={unitId}
              onValueChange={(v) => {
                setUnitId(v);
                setCategoryId("");
              }}
            >
              <SelectTrigger id="unit">
                <SelectValue placeholder="Selecionar unidade" />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="cat">
                <SelectValue placeholder="— Sem categoria —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Sem categoria —</SelectItem>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">
              Slug{" "}
              <span className="font-normal text-muted-foreground">(auto)</span>
            </Label>
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
      </fieldset>

      {/* Preço & Media */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-bg-surface p-6">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Preço & Media
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="price">Preço (€) *</Label>
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
            <Input
              id="image"
              value={imageUrl}
              placeholder="https://…"
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {/* SEO */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-bg-surface p-6">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          SEO
        </legend>

        <div className="space-y-1.5">
          <Label htmlFor="seo-title">Título SEO</Label>
          <Input
            id="seo-title"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seo-desc">Descrição SEO</Label>
          <Textarea
            id="seo-desc"
            value={seoDescription}
            rows={3}
            onChange={(e) => setSeoDescription(e.target.value)}
          />
        </div>
      </fieldset>

      {/* Estado */}
      <fieldset className="rounded-2xl border border-border bg-bg-surface p-6">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Estado
        </legend>
        <div className="mt-2 flex items-center">
          <label className="inline-flex cursor-pointer items-center gap-3 text-sm">
            <div
              role="checkbox"
              aria-checked={active}
              tabIndex={0}
              onClick={() => setActive((a) => !a)}
              onKeyDown={(e) => e.key === " " && setActive((a) => !a)}
              className={`relative h-5 w-9 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-bg-surface ${
                active ? "bg-brand" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  active ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
            Activo (visível na loja)
          </label>
        </div>
      </fieldset>

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          disabled={pending}
          size="lg"
          className="bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          {pending ? "A guardar…" : "Guardar produto"}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
