"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Globe, ImageIcon, Search, Settings2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import type { UnitRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/image-upload";
import { GooglePreview } from "@/components/admin/google-preview";
import { saveUnit, uploadImage } from "@/lib/admin-actions";

type UnitState = {
  logoUrl: string | null;
  seoTitle: string;
  seoDescription: string;
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-border"
    >
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copiado" : "Copiar URL"}
    </button>
  );
}

function FaviconUpload() {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useState<HTMLInputElement | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem (PNG, ICO, SVG, WebP).");
      return;
    }
    setUploading(true);
    try {
      const path = `global/favicon-${Date.now()}.webp`;
      const url = await uploadImage("units", path, file);
      setFaviconUrl(url);
      toast.success("Favicon carregado — copie o URL abaixo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar favicon.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {/* Preview */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted">
          {faviconUrl ? (
            <Image src={faviconUrl} alt="Favicon" width={32} height={32} className="h-8 w-8 object-contain" />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
          )}
        </div>
        <div className="flex-1">
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
              {uploading ? "A carregar…" : "Escolher favicon"}
            </span>
            <input
              type="file"
              accept="image/*,.ico"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG, ICO, SVG ou WebP · Recomendado 32×32 px
          </p>
        </div>
      </div>

      {faviconUrl && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="mb-1.5 text-xs font-medium text-foreground">URL do favicon:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-background px-2 py-1.5 font-mono text-[11px] text-brand">
              {faviconUrl}
            </code>
            <CopyButton value={faviconUrl} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Cole este URL no campo <code className="rounded bg-background px-1 font-mono">icons.icon</code> em{" "}
            <code className="rounded bg-background px-1 font-mono">src/app/layout.tsx</code> para activar o favicon.
          </p>
        </div>
      )}
    </div>
  );
}

export function ConfigClient({ units }: { units: UnitRow[] }) {
  const [states, setStates] = useState<Record<string, UnitState>>(() =>
    Object.fromEntries(
      units.map((u) => [
        u.id,
        {
          logoUrl: u.logo_url ?? null,
          seoTitle: u.seo?.title ?? "",
          seoDescription: u.seo?.description ?? "",
        },
      ]),
    ),
  );
  const [pending, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);

  function update(id: string, patch: Partial<UnitState>) {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function save(u: UnitRow) {
    const s = states[u.id];
    setSavingId(u.id);
    startTransition(async () => {
      try {
        await saveUnit({
          id: u.id,
          name: u.name,
          slug: u.slug,
          address: u.address,
          maps_url: u.maps_url,
          whatsapp: u.whatsapp,
          phone: u.phone,
          buk_url: u.buk_url,
          logo_url: s.logoUrl,
          banner_url: u.banner_url,
          hours: u.hours,
          socials: u.socials,
          seo: {
            title: s.seoTitle || undefined,
            description: s.seoDescription || undefined,
          },
          active: u.active,
        });
        toast.success(`${u.name} guardada.`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      } finally {
        setSavingId(null);
      }
    });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbeariaofbrothers.vercel.app";

  return (
    <div>
      <header className="mb-7 border-b border-border pb-6">
        <h1 className="font-heading text-[32px] font-semibold leading-none tracking-tight">
          Configurações
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Logo, SEO e informações — geridos por unidade.
        </p>
      </header>

      {/* Per-unit cards */}
      <div className="mb-10 space-y-6">
        {units.map((u) => {
          const s = states[u.id];
          const previewUrl = `${siteUrl}/${u.slug}`;
          const isSaving = savingId === u.id && pending;
          return (
            <div
              key={u.id}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
            >
              {/* Card header */}
              <div className="flex items-center gap-4 border-b border-border px-4 py-4 sm:px-6">
                {s.logoUrl ? (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    <Image
                      src={s.logoUrl}
                      alt={u.name}
                      fill
                      className="object-contain p-1"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted text-muted-foreground">
                    <Settings2 className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-heading text-lg font-semibold leading-none">
                    {u.name}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                      /{u.slug}
                    </code>
                    {" · "}
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        u.active
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {u.active ? "Activa" : "Inactiva"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Card body */}
              <div className="grid gap-8 p-4 sm:grid-cols-2 sm:p-6">
                {/* Logo upload */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/10">
                      <Settings2 className="h-3.5 w-3.5 text-brand" />
                    </div>
                    <span className="text-sm font-semibold">Logo</span>
                  </div>
                  <ImageUpload
                    value={s.logoUrl}
                    onChange={(url) => update(u.id, { logoUrl: url })}
                    bucket="units"
                    pathPrefix={`logos/${u.slug}`}
                    aspectRatio="square"
                  />
                </div>

                {/* SEO fields */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/10">
                      <Search className="h-3.5 w-3.5 text-brand" />
                    </div>
                    <span className="text-sm font-semibold">SEO</span>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`seo-title-${u.id}`}
                        className="text-sm font-medium"
                      >
                        Título SEO
                      </Label>
                      <Input
                        id={`seo-title-${u.id}`}
                        value={s.seoTitle}
                        placeholder={u.name}
                        onChange={(e) =>
                          update(u.id, { seoTitle: e.target.value })
                        }
                      />
                      <p className="text-right text-xs text-muted-foreground">
                        {s.seoTitle.length}/60
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`seo-desc-${u.id}`}
                        className="text-sm font-medium"
                      >
                        Descrição SEO
                      </Label>
                      <Textarea
                        id={`seo-desc-${u.id}`}
                        value={s.seoDescription}
                        rows={3}
                        placeholder="Uma breve descrição desta unidade…"
                        onChange={(e) =>
                          update(u.id, { seoDescription: e.target.value })
                        }
                      />
                      <p className="text-right text-xs text-muted-foreground">
                        {s.seoDescription.length}/160
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google preview */}
              <div className="border-t border-border px-4 pb-6 pt-4 sm:px-6">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  Pré-visualização Google
                </div>
                <GooglePreview
                  title={s.seoTitle || u.name}
                  url={previewUrl}
                  description={s.seoDescription}
                />
              </div>

              {/* Save button */}
              <div className="flex justify-end border-t border-border px-4 py-4 sm:px-6">
                <Button
                  onClick={() => save(u)}
                  disabled={isSaving}
                  className="bg-brand text-primary-foreground hover:bg-brand-hover"
                >
                  {isSaving ? "A guardar…" : `Guardar ${u.name}`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global config */}
      <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <Settings2 className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-semibold">
              Configuração global
            </h2>
            <p className="text-sm text-muted-foreground">
              Favicon e ficheiros partilhados
            </p>
          </div>
        </div>

        {/* Favicon upload */}
        <div className="mb-8 rounded-xl border border-border p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/10">
              <ImageIcon className="h-3.5 w-3.5 text-brand" />
            </div>
            <span className="text-sm font-semibold">Favicon</span>
          </div>
          <FaviconUpload />
        </div>

        <ul className="space-y-3 text-sm">
          {[
            {
              label: "Metadata global",
              path: "src/app/layout.tsx",
              detail: "Editar os campos de metadata na raiz do layout",
            },
            {
              label: "Paleta de cores",
              path: "src/app/globals.css",
              detail: "Alterar as variáveis CSS do design system",
            },
          ].map((item) => (
            <li key={item.path} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand/10">
                <Settings2 className="h-3 w-3 text-brand" />
              </div>
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
                <code className="mt-0.5 inline-block rounded bg-muted px-2 py-0.5 font-mono text-xs text-brand">
                  {item.path}
                </code>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
