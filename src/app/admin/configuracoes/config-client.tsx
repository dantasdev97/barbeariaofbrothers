"use client";

import { useState, useTransition } from "react";
import { Globe, Search, Settings2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import type { UnitRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/image-upload";
import { saveUnit } from "@/lib/admin-actions";

type UnitState = {
  logoUrl: string | null;
  seoTitle: string;
  seoDescription: string;
};

function GooglePreview({
  title,
  url,
  description,
}: {
  title: string;
  url: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-[#dfe1e5] bg-white p-4 font-sans">
      <div className="mb-1 flex items-center gap-1.5">
        <Globe className="h-3.5 w-3.5 shrink-0 text-[#4d5156]" />
        <span className="truncate text-xs text-[#4d5156]">{url}</span>
      </div>
      <p className="text-base font-medium leading-snug text-[#1a0dab] line-clamp-1 hover:underline cursor-pointer">
        {title || "Título da página"}
      </p>
      <p className="mt-0.5 text-xs leading-relaxed text-[#4d5156] line-clamp-2">
        {description || "Descrição que aparece nos resultados de pesquisa do Google…"}
      </p>
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbeariaofbrothers.pt";

  return (
    <div>
      <header className="mb-5 border-b border-border pb-5 sm:mb-7 sm:pb-6">
        <h1 className="font-heading text-2xl font-semibold leading-none tracking-tight sm:text-[32px]">
          Configurações
        </h1>
        <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
          Logo, SEO e informações — geridos por unidade.
        </p>
      </header>

      {/* Per-unit cards */}
      <div className="mb-8 space-y-4 sm:mb-10 sm:space-y-6">
        {units.map((u) => {
          const s = states[u.id];
          const previewUrl = `${siteUrl}/${u.slug}`;
          const isSaving = savingId === u.id && pending;
          return (
            <div
              key={u.id}
              className="rounded-xl border border-border bg-white shadow-sm sm:rounded-2xl"
            >
              {/* Card header */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
                {s.logoUrl ? (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    <Image src={s.logoUrl} alt={u.name} fill className="object-contain p-1" sizes="48px" />
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
              <div className="grid gap-6 p-4 sm:grid-cols-2 sm:gap-8 sm:p-6">
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
                      <Label htmlFor={`seo-title-${u.id}`} className="text-sm font-medium">
                        Título SEO
                      </Label>
                      <Input
                        id={`seo-title-${u.id}`}
                        value={s.seoTitle}
                        placeholder={u.name}
                        onChange={(e) => update(u.id, { seoTitle: e.target.value })}
                      />
                      <p className="text-right text-xs text-muted-foreground">
                        {s.seoTitle.length}/60
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`seo-desc-${u.id}`} className="text-sm font-medium">
                        Descrição SEO
                      </Label>
                      <Textarea
                        id={`seo-desc-${u.id}`}
                        value={s.seoDescription}
                        rows={3}
                        placeholder="Uma breve descrição desta unidade…"
                        onChange={(e) => update(u.id, { seoDescription: e.target.value })}
                      />
                      <p className="text-right text-xs text-muted-foreground">
                        {s.seoDescription.length}/160
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google preview */}
              <div className="border-t border-border px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
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
              <div className="flex justify-end border-t border-border px-4 py-3 sm:px-6 sm:py-4">
                <Button
                  onClick={() => save(u)}
                  disabled={isSaving}
                  className="w-full bg-brand text-primary-foreground hover:bg-brand-hover sm:w-auto"
                >
                  {isSaving ? "A guardar…" : `Guardar ${u.name}`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global config */}
      <div className="rounded-xl border border-border bg-white p-5 sm:rounded-2xl sm:p-8">
        <div className="mb-5 flex items-center gap-3 sm:mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 sm:h-10 sm:w-10 sm:rounded-xl">
            <Settings2 className="h-4 w-4 text-brand sm:h-5 sm:w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold sm:text-xl">Configuração global</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Ficheiros partilhados por todas as unidades
            </p>
          </div>
        </div>
        <ul className="space-y-3 text-sm">
          {[
            {
              label: "Favicon",
              path: "public/favicon.ico",
              detail: "Substituir o ficheiro na pasta public/",
            },
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
