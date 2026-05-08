"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Image as ImageIcon, Search, SlidersHorizontal, Tag } from "lucide-react";
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
import { ImageUpload } from "@/components/admin/image-upload";
import { saveProduct } from "@/lib/admin-actions";
import { slugify } from "@/lib/utils";

type Props = {
  initial?: ProductRow;
  units: Pick<UnitRow, "id" | "name">[];
  categories: ProductCategoryRow[];
  onSuccess?: () => void;
};

export function ProductForm({ initial, units, categories, onSuccess }: Props) {
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
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);
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
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/admin/produtos");
        }
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Classificação */}
      <Section icon={<Tag className="h-4 w-4 text-brand" />} title="Classificação">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="unit" label="Unidade">
            <Select
              value={unitId}
              onValueChange={(v) => {
                setUnitId(v ?? "");
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
          </Field>
          <Field id="cat" label="Categoria">
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
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
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="Nome *">
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field id="price" label="Preço (€) *">
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              required
              value={priceEuros}
              onChange={(e) => setPriceEuros(e.target.value)}
            />
          </Field>
        </div>

        <Field
          id="slug"
          label={
            <>
              Slug{" "}
              <span className="font-normal text-muted-foreground">(auto)</span>
            </>
          }
        >
          <Input
            id="slug"
            value={slug}
            placeholder={slugify(name) || "ex: pomada-classica"}
            onChange={(e) => setSlug(slugify(e.target.value))}
          />
        </Field>

        <Field id="description" label="Descrição">
          <Textarea
            id="description"
            value={description}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </Section>

      {/* Imagem */}
      <Section icon={<ImageIcon className="h-4 w-4 text-brand" />} title="Imagem">
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          bucket="products"
          pathPrefix="images"
          aspectRatio="wide"
          label="Imagem do produto"
        />
      </Section>

      {/* SEO */}
      <Section icon={<Search className="h-4 w-4 text-brand" />} title="SEO">
        <Field id="seo-title" label="Título SEO">
          <Input
            id="seo-title"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
          />
        </Field>
        <Field id="seo-desc" label="Descrição SEO">
          <Textarea
            id="seo-desc"
            value={seoDescription}
            rows={3}
            onChange={(e) => setSeoDescription(e.target.value)}
          />
        </Field>
      </Section>

      {/* Estado */}
      <Section
        icon={<SlidersHorizontal className="h-4 w-4 text-brand" />}
        title="Estado"
      >
        <label className="inline-flex cursor-pointer items-center gap-3 text-sm">
          <button
            type="button"
            role="switch"
            aria-checked={active}
            onClick={() => setActive((a) => !a)}
            className={`relative h-5 w-9 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
              active ? "bg-brand" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                active ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          Activo (visível na loja)
        </label>
      </Section>

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          disabled={pending}
          className="bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          {pending ? "A guardar…" : "Guardar produto"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (onSuccess ? onSuccess() : router.back())}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}
