"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { UnitRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveUnit } from "@/lib/admin-actions";
import { slugify } from "@/lib/utils";

type Props = { initial?: UnitRow; onSuccess?: () => void };

export function UnitForm({ initial, onSuccess }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [mapsUrl, setMapsUrl] = useState(initial?.maps_url ?? "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [bukUrl, setBukUrl] = useState(initial?.buk_url ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "");
  const [bannerUrl, setBannerUrl] = useState(initial?.banner_url ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seo?.title ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seo?.description ?? "");
  const [instagram, setInstagram] = useState(initial?.socials?.instagram ?? "");
  const [facebook, setFacebook] = useState(initial?.socials?.facebook ?? "");
  const [tiktok, setTiktok] = useState(initial?.socials?.tiktok ?? "");
  const [active, setActive] = useState(initial?.active ?? true);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveUnit({
          id: initial?.id,
          name,
          slug: slug || slugify(name),
          address: address || null,
          maps_url: mapsUrl || null,
          whatsapp: whatsapp || null,
          phone: phone || null,
          buk_url: bukUrl || null,
          logo_url: logoUrl || null,
          banner_url: bannerUrl || null,
          seo: {
            title: seoTitle || undefined,
            description: seoDescription || undefined,
          },
          socials: {
            instagram: instagram || undefined,
            facebook: facebook || undefined,
            tiktok: tiktok || undefined,
          },
          active,
        });
        toast.success("Unidade guardada.");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/admin/unidades");
        }
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Identificação */}
      <Section title="Identificação">
        <Field id="name" label="Nome *">
          <Input id="name" value={name} required onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field id="slug" label={<>Slug (URL) <span className="font-normal text-muted-foreground">(auto)</span></>}>
          <Input
            id="slug"
            value={slug}
            placeholder={slugify(name) || "ex: unidade-1"}
            onChange={(e) => setSlug(slugify(e.target.value))}
          />
        </Field>
      </Section>

      {/* Contacto */}
      <Section title="Contacto">
        <Field id="address" label="Morada">
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <Field id="maps" label="URL do Google Maps">
          <Input id="maps" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="phone" label="Telefone">
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field id="whatsapp" label="WhatsApp (só dígitos, com indicativo)">
            <Input
              id="whatsapp"
              value={whatsapp}
              placeholder="351900000000"
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </Field>
        </div>
        <Field id="buk" label="URL Buk.pt">
          <Input id="buk" value={bukUrl} onChange={(e) => setBukUrl(e.target.value)} />
        </Field>
      </Section>

      {/* Imagens */}
      <Section title="Imagens">
        <Field id="logo" label="Logo (URL)">
          <Input id="logo" value={logoUrl} placeholder="https://…" onChange={(e) => setLogoUrl(e.target.value)} />
        </Field>
        <Field id="banner" label="Banner (URL)">
          <Input id="banner" value={bannerUrl} placeholder="https://…" onChange={(e) => setBannerUrl(e.target.value)} />
        </Field>
      </Section>

      {/* Redes sociais */}
      <Section title="Redes sociais">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="instagram" label="Instagram">
            <Input id="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          </Field>
          <Field id="facebook" label="Facebook">
            <Input id="facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
          </Field>
          <Field id="tiktok" label="TikTok">
            <Input id="tiktok" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* SEO */}
      <Section title="SEO">
        <Field id="seo-title" label="Título SEO">
          <Input id="seo-title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
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
      <Section title="Estado">
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
          Activa (visível no site)
        </label>
      </Section>

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          disabled={pending}
          size="lg"
          className="bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          {pending ? "A guardar…" : "Guardar unidade"}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => onSuccess ? onSuccess() : router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border border-border bg-bg-surface p-6">
      <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </legend>
      <div className="mt-1 space-y-4">{children}</div>
    </fieldset>
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
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
