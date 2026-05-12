"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, SlidersHorizontal, Tag } from "lucide-react";
import type {
  ProductCategoryRow,
  ProductRow,
  UnitRow,
} from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/image-upload";
import { GooglePreview } from "@/components/admin/google-preview";
import { Stepper, type WizardStep } from "@/components/admin/stepper";
import { Section, Field, Toggle, CharCounter } from "@/components/admin/form-bits";
import { saveProduct } from "@/lib/admin-actions";
import { slugify, formatPrice, formatPriceOrAsk, cn } from "@/lib/utils";

type UnitLite = Pick<UnitRow, "id" | "name" | "slug">;

type Props = {
  initial?: ProductRow;
  units: UnitLite[];
  categories: ProductCategoryRow[];
  onSuccess?: () => void;
};

const STEPS: WizardStep[] = [
  { id: "produto", title: "Produto", subtitle: "Informações básicas" },
  { id: "preco", title: "Preço & stock", subtitle: "Valores e disponibilidade" },
  { id: "seo", title: "SEO", subtitle: "Otimização para pesquisa" },
  { id: "estado", title: "Estado", subtitle: "Visibilidade e revisão" },
];

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbeariaofbrothers.pt";

function toEuros(cents: number | null | undefined) {
  return cents != null ? (cents / 100).toFixed(2) : "";
}
function toCents(euros: string): number | null {
  const t = euros.trim();
  if (t === "") return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function ProductForm({ initial, units, categories, onSuccess }: Props) {
  const router = useRouter();
  const isNew = !initial;
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);

  const [unitIds, setUnitIds] = useState<string[]>(
    initial ? [initial.unit_id] : units[0] ? [units[0].id] : [],
  );
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);

  const [priceEuros, setPriceEuros] = useState(toEuros(initial?.price_cents));
  const [compareEuros, setCompareEuros] = useState(toEuros(initial?.compare_at_price_cents));
  const [stock, setStock] = useState(String(initial?.stock ?? 0));
  const [outOfStock, setOutOfStock] = useState(initial?.out_of_stock ?? false);
  const [featured, setFeatured] = useState(initial?.featured ?? false);

  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seo_description ?? "");
  const [active, setActive] = useState(initial?.active ?? true);

  const primaryUnitId = unitIds[0] ?? "";
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.unit_id === primaryUnitId),
    [categories, primaryUnitId],
  );
  const unit = units.find((u) => u.id === primaryUnitId);
  const effSlug = slug || slugify(name);

  const priceCents = toCents(priceEuros);
  const compareCents = toCents(compareEuros);
  const discountPct =
    compareCents != null && priceCents != null && priceCents > 0 && compareCents > priceCents
      ? Math.round(((compareCents - priceCents) / compareCents) * 100)
      : null;

  function toggleUnit(id: string) {
    setUnitIds((prev) => {
      const has = prev.includes(id);
      const next = has ? prev.filter((x) => x !== id) : [...prev, id];
      // category belongs to a unit — reset if the primary unit changed
      if (next[0] !== prev[0]) setCategoryId("");
      return next;
    });
  }

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (unitIds.filter(Boolean).length === 0) return "Selecione pelo menos uma unidade.";
      if (!name.trim()) return "Indique o nome do produto.";
    }
    if (s === 1) {
      if (priceEuros.trim() !== "" && priceCents == null) return "Preço inválido.";
      if (compareEuros.trim() !== "" && compareCents == null) return "Preço antes inválido.";
      if (
        compareCents != null && priceCents != null && priceCents > 0 && compareCents <= priceCents
      )
        return "O 'preço antes' tem de ser maior que o preço actual.";
      const st = Number(stock);
      if (!Number.isInteger(st) || st < 0) return "Stock inválido.";
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) return toast.error(err);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function jumpTo(target: number) {
    if (target <= step) return setStep(target);
    for (let s = step; s < target; s++) {
      const err = validateStep(s);
      if (err) return toast.error(err);
    }
    setStep(target);
  }

  function submit() {
    for (let s = 0; s < STEPS.length - 1; s++) {
      const err = validateStep(s);
      if (err) {
        setStep(s);
        return toast.error(err);
      }
    }
    const targets = isNew ? unitIds.filter(Boolean) : [primaryUnitId];
    const base = {
      category_id: categoryId || null,
      name: name.trim(),
      slug: effSlug,
      description: description.trim() || null,
      price_cents: priceCents ?? 0,
      compare_at_price_cents: compareCents,
      stock: Number(stock),
      out_of_stock: outOfStock,
      featured,
      image_url: imageUrl || null,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      active,
    };
    startTransition(async () => {
      try {
        for (const uid of targets) {
          await saveProduct({ id: initial?.id, unit_id: uid, ...base });
        }
        toast.success(
          targets.length > 1 ? `Produto guardado em ${targets.length} unidades.` : "Produto guardado.",
        );
        if (onSuccess) onSuccess();
        else router.push("/admin/produtos");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  function onFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) goNext();
    else submit();
  }

  const isLast = step === STEPS.length - 1;
  const unitSummary = (() => {
    const sel = isNew ? unitIds.filter(Boolean) : [primaryUnitId];
    if (sel.length === 0) return "—";
    if (sel.length === 1) return units.find((u) => u.id === sel[0])?.name ?? "—";
    return `${sel.length} unidades`;
  })();

  return (
    <form onSubmit={onFormSubmit} className="space-y-5">
      <Stepper steps={STEPS} current={step} onStepClick={jumpTo} />

      {step === 0 && (
        <Section icon={<Tag className="h-4 w-4 text-brand" />} title="Produto">
          {isNew ? (
            <Field label="Unidades *" hint="O produto é criado em cada unidade seleccionada.">
              <div className="flex flex-wrap items-center gap-2">
                {units.map((u) => {
                  const on = unitIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUnit(u.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                        on
                          ? "border-brand bg-brand text-primary-foreground"
                          : "border-border bg-bg-surface text-muted-foreground hover:bg-background hover:text-foreground",
                      )}
                    >
                      {u.name}
                    </button>
                  );
                })}
                {units.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setUnitIds(unitIds.length === units.length ? [units[0].id] : units.map((u) => u.id))
                    }
                    className="rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    {unitIds.length === units.length ? "Limpar" : "Todas as unidades"}
                  </button>
                )}
              </div>
            </Field>
          ) : (
            <Field id="unit" label="Unidade *">
              <Select value={primaryUnitId} onValueChange={(v) => { setUnitIds([v ?? ""]); setCategoryId(""); }}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Selecionar unidade">
                    {(v) => units.find((u) => u.id === v)?.name ?? ""}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="cat" label="Categoria">
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                <SelectTrigger id="cat">
                  <SelectValue placeholder="— Sem categoria —">
                    {(v) => filteredCategories.find((c) => c.id === v)?.name ?? "— Sem categoria —"}
                  </SelectValue>
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
            <Field id="name" label="Nome *">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
          </div>

          <Field id="description" label="Descrição">
            <Textarea
              id="description"
              value={description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <Field label="Imagem do produto">
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              bucket="products"
              pathPrefix="images"
              aspectRatio="wide"
            />
          </Field>
        </Section>
      )}

      {step === 1 && (
        <Section icon={<Tag className="h-4 w-4 text-brand" />} title="Preço & stock">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="price" label="Preço (€)" hint="Opcional — em branco mostra 'Sob consulta' na loja.">
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={priceEuros}
                onChange={(e) => setPriceEuros(e.target.value)}
              />
            </Field>
            <Field
              id="compare"
              label="Preço antes (€)"
              hint={
                discountPct != null
                  ? `Mostra ${formatPrice(compareCents!)} riscado · desconto de ${discountPct}%`
                  : "Opcional — preço original riscado na loja"
              }
            >
              <Input
                id="compare"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={compareEuros}
                onChange={(e) => setCompareEuros(e.target.value)}
              />
            </Field>
          </div>

          <Field id="stock" label="Stock (quantidade)" hint="0 ou marca 'esgotado' → aparece como esgotado na loja.">
            <Input
              id="stock"
              type="number"
              step="1"
              min="0"
              inputMode="numeric"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </Field>

          <div className="space-y-3 rounded-lg bg-bg-surface p-4">
            <Toggle
              checked={outOfStock}
              onChange={setOutOfStock}
              label="Esgotado"
              description="Marca o produto como indisponível independentemente da quantidade."
            />
            <Toggle
              checked={featured}
              onChange={setFeatured}
              label="Em destaque"
              description="Aparece primeiro na loja da unidade."
            />
          </div>
        </Section>
      )}

      {step === 2 && (
        <Section icon={<Search className="h-4 w-4 text-brand" />} title="SEO">
          <Field
            id="slug"
            label={
              <>
                Slug <span className="font-normal text-muted-foreground">(auto)</span>
              </>
            }
            hint={`URL: ${SITE_URL}/${unit?.slug ?? "unidade"}/produtos/${effSlug || "…"}`}
          >
            <Input
              id="slug"
              value={slug}
              placeholder={slugify(name) || "ex: pomada-classica"}
              onChange={(e) => setSlug(slugify(e.target.value))}
            />
          </Field>

          <Field
            id="seo-title"
            label="Título SEO"
            hint={<CharCounter value={seoTitle} min={50} max={70} />}
          >
            <Input
              id="seo-title"
              value={seoTitle}
              placeholder={`${name} | ${unit?.name ?? "Barbearia Of Brothers"}`}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </Field>
          <Field
            id="seo-desc"
            label="Descrição SEO"
            hint={<CharCounter value={seoDescription} min={120} max={160} />}
          >
            <Textarea
              id="seo-desc"
              value={seoDescription}
              rows={3}
              placeholder="Descrição que aparece nos resultados do Google…"
              onChange={(e) => setSeoDescription(e.target.value)}
            />
          </Field>

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
              Pré-visualização Google
              {isNew && unitIds.filter(Boolean).length > 1 && (
                <span className="ml-1 text-muted-foreground/70">(+{unitIds.filter(Boolean).length - 1} unidades)</span>
              )}
            </div>
            <GooglePreview
              title={seoTitle || `${name || "Produto"} | ${unit?.name ?? "Barbearia Of Brothers"}`}
              url={`${SITE_URL}/${unit?.slug ?? "unidade"}/produtos/${effSlug}`}
              description={seoDescription}
            />
          </div>
        </Section>
      )}

      {step === 3 && (
        <Section
          icon={<SlidersHorizontal className="h-4 w-4 text-brand" />}
          title="Estado & revisão"
        >
          <Toggle
            checked={active}
            onChange={setActive}
            label="Activo (visível na loja)"
            description="Desactiva para esconder o produto sem o eliminar."
          />

          <dl className="grid gap-x-4 gap-y-2 rounded-lg bg-bg-surface p-4 text-sm sm:grid-cols-2">
            <Summary label="Nome" value={name || "—"} />
            <Summary label={isNew && unitIds.filter(Boolean).length > 1 ? "Unidades" : "Unidade"} value={unitSummary} />
            <Summary
              label="Categoria"
              value={filteredCategories.find((c) => c.id === categoryId)?.name ?? "Sem categoria"}
            />
            <Summary
              label="Preço"
              value={
                (priceCents ?? 0) > 0
                  ? compareCents != null && discountPct != null
                    ? `${formatPrice(priceCents!)} (antes ${formatPrice(compareCents)} · −${discountPct}%)`
                    : formatPrice(priceCents!)
                  : formatPriceOrAsk(0)
              }
            />
            <Summary
              label="Stock"
              value={outOfStock || Number(stock) === 0 ? "Esgotado" : `${stock} un.`}
            />
            <Summary label="Destaque" value={featured ? "Sim" : "Não"} />
          </dl>
        </Section>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          onClick={() => (step === 0 ? (onSuccess ? onSuccess() : router.back()) : setStep((s) => s - 1))}
        >
          {step === 0 ? "Cancelar" : "← Anterior"}
        </Button>
        <Button
          type="submit"
          disabled={pending}
          className="bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          {isLast ? (pending ? "A guardar…" : "Guardar produto") : "Seguinte →"}
        </Button>
      </div>
    </form>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
