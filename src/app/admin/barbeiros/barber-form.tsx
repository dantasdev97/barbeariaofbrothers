"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { BarberRow, UnitRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveBarber } from "@/lib/admin-actions";
import { slugify } from "@/lib/utils";

type Props = {
  initial?: BarberRow;
  units: Pick<UnitRow, "id" | "name" | "slug">[];
};

export function BarberForm({ initial, units }: Props) {
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
        router.push("/admin/barbeiros");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <fieldset className="rounded-2xl border border-white/10 bg-bg-surface p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="unit">Unidade</Label>
          <select
            id="unit"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="h-9 w-full rounded-md border border-white/10 bg-input px-3 text-sm"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id} className="bg-bg-surface">
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
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

        <div className="space-y-1.5">
          <Label htmlFor="photo">Foto (URL)</Label>
          <Input id="photo" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="buk">Buk URL (específico do barbeiro)</Label>
          <Input id="buk" value={bukUrl} onChange={(e) => setBukUrl(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="ig">Instagram</Label>
            <Input id="ig" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fb">Facebook</Label>
            <Input id="fb" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tk">TikTok</Label>
            <Input id="tk" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
          </div>
        </div>

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
          <label className="inline-flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-brand"
            />
            Activo
          </label>
        </div>
      </fieldset>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={pending}
          size="lg"
          className="bg-brand text-primary-foreground hover:bg-brand-hover"
        >
          {pending ? "A guardar…" : "Guardar"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
