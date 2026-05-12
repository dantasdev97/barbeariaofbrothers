"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  MapPin,
  Search,
  SlidersHorizontal,
  Store,
} from "lucide-react";
import type { UnitRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/image-upload";
import { VideoUpload } from "@/components/admin/video-upload";
import { GooglePreview } from "@/components/admin/google-preview";
import { Stepper, type WizardStep } from "@/components/admin/stepper";
import { Section, Field, Toggle, CharCounter } from "@/components/admin/form-bits";
import { saveUnit } from "@/lib/admin-actions";
import { slugify } from "@/lib/utils";

type Props = { initial?: UnitRow; onSuccess?: () => void };

const STEPS: WizardStep[] = [
  { id: "identificacao", title: "Identificação", subtitle: "Nome e morada" },
  { id: "contacto", title: "Contacto", subtitle: "Telefone e redes" },
  { id: "media", title: "Imagens & vídeo", subtitle: "Logo, banner e hero" },
  { id: "seo", title: "SEO", subtitle: "Pesquisa e partilha" },
  { id: "estado", title: "Estado", subtitle: "Visibilidade e revisão" },
];

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbeariaofbrothers.pt";

export function UnitForm({ initial, onSuccess }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [mapsUrl, setMapsUrl] = useState(initial?.maps_url ?? "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [bukUrl, setBukUrl] = useState(initial?.buk_url ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(initial?.logo_url ?? null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(initial?.banner_url ?? null);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(
    initial?.hero_video_url ?? null,
  );
  const [instagram, setInstagram] = useState(initial?.socials?.instagram ?? "");
  const [facebook, setFacebook] = useState(initial?.socials?.facebook ?? "");
  const [tiktok, setTiktok] = useState(initial?.socials?.tiktok ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seo?.title ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seo?.description ?? "");
  const [active, setActive] = useState(initial?.active ?? true);

  const effSlug = slug || slugify(name);

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!name.trim()) return "Indique o nome da unidade.";
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
    startTransition(async () => {
      try {
        await saveUnit({
          id: initial?.id,
          name: name.trim(),
          slug: effSlug,
          address: address.trim() || null,
          maps_url: mapsUrl.trim() || null,
          whatsapp: whatsapp.trim() || null,
          phone: phone.trim() || null,
          buk_url: bukUrl.trim() || null,
          logo_url: logoUrl || null,
          banner_url: bannerUrl || null,
          hero_video_url: heroVideoUrl || null,
          seo: {
            title: seoTitle.trim() || undefined,
            description: seoDescription.trim() || undefined,
          },
          socials: {
            instagram: instagram.trim() || undefined,
            facebook: facebook.trim() || undefined,
            tiktok: tiktok.trim() || undefined,
          },
          active,
        });
        toast.success("Unidade guardada.");
        if (onSuccess) onSuccess();
        else router.push("/admin/unidades");
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
  const previewTitle =
    seoTitle || `${name || "Unidade"} | Barbearia Of Brothers`;
  const previewUrl = `${SITE_URL}/${effSlug || "unidade"}`;

  return (
    <form onSubmit={onFormSubmit} className="space-y-5">
      <Stepper steps={STEPS} current={step} onStepClick={jumpTo} />

      <div className="[&_input]:rounded-none [&_textarea]:rounded-none [&_[data-slot=select-trigger]]:rounded-none">
        {step === 0 && (
          <Section icon={<Store className="h-4 w-4 text-brand" />} title="Identificação">
            <Field id="name" label="Nome *">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field
              id="slug"
              label={
                <>
                  Slug <span className="font-normal text-muted-foreground">(auto)</span>
                </>
              }
              hint={`URL: ${SITE_URL}/${effSlug || "…"}`}
            >
              <Input
                id="slug"
                value={slug}
                placeholder={slugify(name) || "ex: leiria-centro"}
                onChange={(e) => setSlug(slugify(e.target.value))}
              />
            </Field>
            <Field id="address" label="Morada">
              <Input
                id="address"
                value={address}
                placeholder="Rua Vale de Lobos, 33"
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>
            <Field id="maps" label="URL do Google Maps">
              <Input
                id="maps"
                value={mapsUrl}
                placeholder="https://maps.google.com/…"
                onChange={(e) => setMapsUrl(e.target.value)}
              />
            </Field>
          </Section>
        )}

        {step === 1 && (
          <Section
            icon={<MapPin className="h-4 w-4 text-brand" />}
            title="Contacto & agendamento"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="phone" label="Telefone">
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field id="whatsapp" label="WhatsApp (com indicativo)">
                <Input
                  id="whatsapp"
                  value={whatsapp}
                  placeholder="+351900000000"
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </Field>
            </div>
            <Field id="buk" label="URL Buk.pt (agendamento)">
              <Input
                id="buk"
                value={bukUrl}
                placeholder="https://buk.pt/…"
                onChange={(e) => setBukUrl(e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="instagram" label="Instagram">
                <Input
                  id="instagram"
                  value={instagram}
                  placeholder="@username"
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </Field>
              <Field id="facebook" label="Facebook">
                <Input
                  id="facebook"
                  value={facebook}
                  placeholder="username"
                  onChange={(e) => setFacebook(e.target.value)}
                />
              </Field>
              <Field id="tiktok" label="TikTok">
                <Input
                  id="tiktok"
                  value={tiktok}
                  placeholder="@username"
                  onChange={(e) => setTiktok(e.target.value)}
                />
              </Field>
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section
            icon={<ImageIcon className="h-4 w-4 text-brand" />}
            title="Imagens & vídeo"
            description="O vídeo (ou, se não houver vídeo, o banner) aparece como fundo do hero da unidade no site."
          >
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
            <VideoUpload
              value={heroVideoUrl}
              onChange={setHeroVideoUrl}
              pathPrefix="videos"
              label="Vídeo do hero"
            />
          </Section>
        )}

        {step === 3 && (
          <Section icon={<Search className="h-4 w-4 text-brand" />} title="SEO">
            <Field
              id="seo-title"
              label="Título SEO"
              hint={<CharCounter value={seoTitle} min={50} max={70} />}
            >
              <Input
                id="seo-title"
                value={seoTitle}
                placeholder={`${name || "Unidade"} | Barbearia Of Brothers`}
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
              </div>
              <GooglePreview
                title={previewTitle}
                url={previewUrl}
                description={seoDescription}
              />
            </div>
          </Section>
        )}

        {step === 4 && (
          <Section
            icon={<SlidersHorizontal className="h-4 w-4 text-brand" />}
            title="Estado & revisão"
          >
            <Toggle
              checked={active}
              onChange={setActive}
              label="Activa (visível no site)"
              description="Desactiva para esconder a unidade sem a eliminar."
            />
            <dl className="grid gap-x-4 gap-y-2 rounded-lg bg-bg-surface p-4 text-sm sm:grid-cols-2">
              <Summary label="Nome" value={name || "—"} />
              <Summary label="URL" value={`/${effSlug || "…"}`} />
              <Summary label="Morada" value={address || "—"} />
              <Summary label="WhatsApp" value={whatsapp || "—"} />
              <Summary label="Logo" value={logoUrl ? "Sim" : "Não"} />
              <Summary label="Banner" value={bannerUrl ? "Sim" : "Não"} />
              <Summary label="Vídeo do hero" value={heroVideoUrl ? "Sim" : "Não"} />
              <Summary label="Título SEO" value={seoTitle || "—"} />
            </dl>
          </Section>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            step === 0
              ? onSuccess
                ? onSuccess()
                : router.back()
              : setStep((s) => s - 1)
          }
        >
          {step === 0 ? "Cancelar" : "← Anterior"}
        </Button>
        <Button
          type="submit"
          disabled={pending}
          className="bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          {isLast ? (pending ? "A guardar…" : "Guardar unidade") : "Seguinte →"}
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
