"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  const [photoUrl, setPhotoUrl] = useState(initial?.photo_url ?? "");
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
    <form onSubmit={onSubmit} className="max-w-3xl space-y-5">
      {/* Unidade & Info básica */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-bg-surface p-6">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Identificação
        </legend>

        <div className="space-y-1.5">
          <Label htmlFor="unit">Unidade</Label>
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
              placeholder={slugify(name) || "ex: joao"}
              onChange={(e) => setSlug(slugify(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="speciality">Especialidade</Label>
          <Input
            id="speciality"
            value={speciality}
            placeholder="Corte clássico & navalha"
            onChange={(e) => setSpeciality(e.target.value)}
          />
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

      {/* Media & Booking */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-bg-surface p-6">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Media & Agendamento
        </legend>

        <div className="space-y-1.5">
          <Label htmlFor="photo">Foto (URL)</Label>
          <Input
            id="photo"
            value={photoUrl}
            placeholder="https://…"
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="buk">Buk URL (específico deste barbeiro)</Label>
          <Input
            id="buk"
            value={bukUrl}
            placeholder="https://buk.pt/…"
            onChange={(e) => setBukUrl(e.target.value)}
          />
        </div>
      </fieldset>

      {/* Redes sociais */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-bg-surface p-6">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Redes sociais
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="ig">Instagram</Label>
            <Input
              id="ig"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fb">Facebook</Label>
            <Input
              id="fb"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tk">TikTok</Label>
            <Input
              id="tk"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {/* Configurações */}
      <fieldset className="space-y-4 rounded-2xl border border-border bg-bg-surface p-6">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Configurações
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="order">Ordem de exibição</Label>
            <Input
              id="order"
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
          </div>
          <div className="flex items-end pb-1">
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
              Activo (visível no site)
            </label>
          </div>
        </div>
      </fieldset>

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          disabled={pending}
          size="lg"
          className="bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          {pending ? "A guardar…" : "Guardar barbeiro"}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => onSuccess ? onSuccess() : router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
