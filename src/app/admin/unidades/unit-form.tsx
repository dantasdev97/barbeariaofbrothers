"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Link2,
  MapPin,
  Search,
  Share2,
  SlidersHorizontal,
  Store,
} from "lucide-react";
import type { UnitRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/image-upload";
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
  const [logoUrl, setLogoUrl] = useState<string | null>(initial?.logo_url ?? null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(initial?.banner_url ?? null);
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
      <Section icon={<Store className="h-4 w-4 text-brand" />} title="Identificação">
        <Field id="name" label="Nome *">
          <Input id="name" value={name} required onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field
          id="slug"
          label={
            <>
              Slug (URL){" "}
              <span className="font-normal text-muted-foreground">(auto)</span>
            </>
          }
        >
          <Input
            id="slug"
            value={slug}
            placeholder={slugify(name) || "ex: unidade-1"}
            onChange={(e) => setSlug(slugify(e.target.value))}
          />
        </Field>
      </Section>

      {/* Contacto */}
      <Section icon={<MapPin className="h-4 w-4 text-brand" />} title="Contacto">
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
          <Field id="whatsapp" label="WhatsApp (com indicativo)">
            <Input
              id="whatsapp"
              value={whatsapp}
              placeholder="351900000000"
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </Field>
        </div>
      </Section>

      {/* Agendamento */}
      <Section icon={<Link2 className="h-4 w-4 text-brand" />} title="Agendamento">
        <Field id="buk" label="URL Buk.pt">
          <Input id="buk" value={bukUrl} onChange={(e) => setBukUrl(e.target.value)} />
        </Field>
      </Section>

      {/* Imagens */}
      <Section icon={<ImageIcon className="h-4 w-4 text-brand" />} title="Imagens">
        <div className="grid gap-6 sm:grid-cols-2">
          <ImageUpload
            value={logoUrl}
            onChange={setLogoUrl}
            bucket="units"
            pathPrefix="logos"
            aspectRatio="square"
            label="Logo"
          />
          <ImageUpload
            value={bannerUrl}
            onChange={setBannerUrl}
            bucket="units"
            pathPrefix="banners"
            aspectRatio="wide"
            label="Banner"
          />
        </div>
      </Section>

      {/* Redes sociais */}
      <Section icon={<Share2 className="h-4 w-4 text-brand" />} title="Redes sociais">
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
      <Section icon={<Search className="h-4 w-4 text-brand" />} title="SEO">
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
          Activa (visível no site)
        </label>
      </Section>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={() => (onSuccess ? onSuccess() : router.back())}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={pending}
          className="w-full bg-brand text-primary-foreground hover:bg-brand-hover sm:w-auto"
        >
          {pending ? "A guardar…" : "Guardar unidade"}
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
    <div className="rounded-lg border border-border bg-white p-4 sm:rounded-xl sm:p-5">
      <div className="mb-3 flex items-center gap-2 sm:mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-3 sm:space-y-4">{children}</div>
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
