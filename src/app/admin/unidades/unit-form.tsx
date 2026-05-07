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

type Props = { initial?: UnitRow };

export function UnitForm({ initial }: Props) {
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
        router.push("/admin/unidades");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="Identificação">
        <Field id="name" label="Nome">
          <Input id="name" value={name} required onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field id="slug" label="Slug (URL)">
          <Input
            id="slug"
            value={slug}
            placeholder={slugify(name) || "ex: unidade-1"}
            onChange={(e) => setSlug(slugify(e.target.value))}
          />
        </Field>
      </Section>

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
          <Field id="whatsapp" label="WhatsApp (com indicativo, só dígitos)">
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

      <Section title="Imagens">
        <Field id="logo" label="Logo (URL)">
          <Input id="logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
        </Field>
        <Field id="banner" label="Banner (URL)">
          <Input id="banner" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} />
        </Field>
      </Section>

      <Section title="Redes sociais">
        <Field id="instagram" label="Instagram">
          <Input id="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        </Field>
        <Field id="facebook" label="Facebook">
          <Input id="facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
        </Field>
        <Field id="tiktok" label="TikTok">
          <Input id="tiktok" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
        </Field>
      </Section>

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

      <Section title="Estado">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-brand"
          />
          Activa (visível no site)
        </label>
      </Section>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={pending}
          size="lg"
          className="bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          {pending ? "A guardar…" : "Guardar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
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
    <fieldset className="rounded-2xl border border-white/10 bg-bg-surface p-6">
      <legend className="px-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
