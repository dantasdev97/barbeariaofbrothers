"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Hash, Image as ImageIcon, Link2, Share2, SlidersHorizontal, User } from "lucide-react";
import type { BarberRow, UnitRow } from "@/types/database.types";
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
import { saveBarber } from "@/lib/admin-actions";
import { slugify } from "@/lib/utils";

type Props = {
  initial?: BarberRow;
  units: Pick<UnitRow, "id" | "name" | "slug">[];
  onSuccess?: () => void;
};

export function BarberForm({ initial, units, onSuccess }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [unitId, setUnitId] = useState(initial?.unit_id ?? units[0]?.id ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [speciality, setSpeciality] = useState(initial?.speciality ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photo_url ?? null);
  const [bukUrl, setBukUrl] = useState(initial?.buk_url ?? "");
  const [instagram, setInstagram] = useState(initial?.socials?.instagram ?? "");
  const [facebook, setFacebook] = useState(initial?.socials?.facebook ?? "");
  const [tiktok, setTiktok] = useState(initial?.socials?.tiktok ?? "");
  const [order, setOrder] = useState(initial?.display_order ?? 0);
  const [active, setActive] = useState(initial?.active ?? true);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!unitId) {
      toast.error("Selecione uma unidade.");
      return;
    }
    startTransition(async () => {
      try {
        await saveBarber({
          id: initial?.id,
          unit_id: unitId,
          name,
          slug: slug || slugify(name),
          speciality: speciality || null,
          description: description || null,
          photo_url: photoUrl || null,
          buk_url: bukUrl || null,
          socials: {
            instagram: instagram || undefined,
            facebook: facebook || undefined,
            tiktok: tiktok || undefined,
          },
          display_order: order,
          active,
        });
        toast.success("Barbeiro guardado.");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/admin/barbeiros");
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
      <Section icon={<User className="h-4 w-4 text-brand" />} title="Identificação">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="unit" label="Unidade">
            <Select value={unitId} onValueChange={(v) => setUnitId(v ?? "")}>
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
          <Field id="order" label="Ordem de exibição">
            <Input
              id="order"
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
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
          <Field id="speciality" label="Especialidade">
            <Input
              id="speciality"
              value={speciality}
              placeholder="Corte clássico & navalha"
              onChange={(e) => setSpeciality(e.target.value)}
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
            placeholder={slugify(name) || "ex: joao"}
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

      {/* Foto */}
      <Section icon={<ImageIcon className="h-4 w-4 text-brand" />} title="Foto">
        <ImageUpload
          value={photoUrl}
          onChange={setPhotoUrl}
          bucket="barbers"
          pathPrefix="photos"
          aspectRatio="square"
          label="Foto do barbeiro"
        />
      </Section>

      {/* Agendamento */}
      <Section icon={<Link2 className="h-4 w-4 text-brand" />} title="Agendamento">
        <Field id="buk" label="Buk URL (específico deste barbeiro)">
          <Input
            id="buk"
            value={bukUrl}
            placeholder="https://buk.pt/…"
            onChange={(e) => setBukUrl(e.target.value)}
          />
        </Field>
      </Section>

      {/* Redes sociais */}
      <Section icon={<Share2 className="h-4 w-4 text-brand" />} title="Redes sociais">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="ig" label="Instagram">
            <Input
              id="ig"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
          </Field>
          <Field id="fb" label="Facebook">
            <Input
              id="fb"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
            />
          </Field>
          <Field id="tk" label="TikTok">
            <Input
              id="tk"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
            />
          </Field>
        </div>
      </Section>

      {/* Estado */}
      <Section icon={<SlidersHorizontal className="h-4 w-4 text-brand" />} title="Estado">
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
          Activo (visível no site)
        </label>
      </Section>

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          disabled={pending}
          className="bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          {pending ? "A guardar…" : "Guardar barbeiro"}
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
