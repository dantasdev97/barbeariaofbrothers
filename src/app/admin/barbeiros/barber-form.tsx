"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2, SlidersHorizontal, User } from "lucide-react";
import type { BarberRow, UnitRow } from "@/types/database.types";
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
import { Stepper, type WizardStep } from "@/components/admin/stepper";
import { Section, Field, Toggle } from "@/components/admin/form-bits";
import { saveBarber } from "@/lib/admin-actions";
import { slugify } from "@/lib/utils";

type Props = {
  initial?: BarberRow;
  units: Pick<UnitRow, "id" | "name" | "slug">[];
  onSuccess?: () => void;
};

const STEPS: WizardStep[] = [
  { id: "barbeiro", title: "Barbeiro", subtitle: "Informações e foto" },
  { id: "redes", title: "Redes & agendamento", subtitle: "Links externos" },
  { id: "estado", title: "Estado", subtitle: "Visibilidade e revisão" },
];

export function BarberForm({ initial, units, onSuccess }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);

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
  const [order, setOrder] = useState(String(initial?.display_order ?? 0));
  const [active, setActive] = useState(initial?.active ?? true);

  const unit = units.find((u) => u.id === unitId);
  const effSlug = slug || slugify(name);

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!unitId) return "Selecione uma unidade.";
      if (!name.trim()) return "Indique o nome do barbeiro.";
      if (!Number.isInteger(Number(order)) || Number(order) < 0)
        return "Ordem inválida.";
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
        await saveBarber({
          id: initial?.id,
          unit_id: unitId,
          name: name.trim(),
          slug: effSlug,
          speciality: speciality.trim() || null,
          description: description.trim() || null,
          photo_url: photoUrl || null,
          buk_url: bukUrl.trim() || null,
          socials: {
            instagram: instagram.trim() || undefined,
            facebook: facebook.trim() || undefined,
            tiktok: tiktok.trim() || undefined,
          },
          display_order: Number(order),
          active,
        });
        toast.success("Barbeiro guardado.");
        if (onSuccess) onSuccess();
        else router.push("/admin/barbeiros");
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

  return (
    <form onSubmit={onFormSubmit} className="space-y-5">
      <Stepper steps={STEPS} current={step} onStepClick={jumpTo} />

      {step === 0 && (
        <Section icon={<User className="h-4 w-4 text-brand" />} title="Barbeiro">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="unit" label="Unidade *">
              <Select value={unitId} onValueChange={(v) => setUnitId(v ?? "")}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Selecionar unidade">
                    {(v: string) => units.find((u) => u.id === v)?.name ?? ""}
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
            <Field id="order" label="Ordem de exibição">
              <Input
                id="order"
                type="number"
                step="1"
                min="0"
                inputMode="numeric"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Nome *">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
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
                Slug <span className="font-normal text-muted-foreground">(auto)</span>
              </>
            }
            hint={`URL: /${unit?.slug ?? "unidade"}/barbeiro/${effSlug || "…"}`}
          >
            <Input
              id="slug"
              value={slug}
              placeholder={slugify(name) || "ex: joao"}
              onChange={(e) => setSlug(slugify(e.target.value))}
            />
          </Field>

          <Field id="description" label="Descrição (aparece no card público)">
            <Textarea
              id="description"
              value={description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <Field label="Foto do barbeiro">
            <ImageUpload
              value={photoUrl}
              onChange={setPhotoUrl}
              bucket="barbers"
              pathPrefix="photos"
              aspectRatio="square"
            />
          </Field>
        </Section>
      )}

      {step === 1 && (
        <Section
          icon={<Link2 className="h-4 w-4 text-brand" />}
          title="Redes & agendamento"
        >
          <Field id="buk" label="Buk URL (link de agendamento deste barbeiro)">
            <Input
              id="buk"
              value={bukUrl}
              placeholder="https://buk.pt/…"
              onChange={(e) => setBukUrl(e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="ig" label="Instagram">
              <Input id="ig" value={instagram} placeholder="@username" onChange={(e) => setInstagram(e.target.value)} />
            </Field>
            <Field id="fb" label="Facebook">
              <Input id="fb" value={facebook} placeholder="username" onChange={(e) => setFacebook(e.target.value)} />
            </Field>
            <Field id="tk" label="TikTok">
              <Input id="tk" value={tiktok} placeholder="@username" onChange={(e) => setTiktok(e.target.value)} />
            </Field>
          </div>
        </Section>
      )}

      {step === 2 && (
        <Section
          icon={<SlidersHorizontal className="h-4 w-4 text-brand" />}
          title="Estado & revisão"
        >
          <Toggle
            checked={active}
            onChange={setActive}
            label="Activo (visível no site)"
            description="Desactiva para esconder o barbeiro sem o eliminar."
          />
          <dl className="grid gap-x-4 gap-y-2 rounded-lg bg-bg-surface p-4 text-sm sm:grid-cols-2">
            <Summary label="Nome" value={name || "—"} />
            <Summary label="Unidade" value={unit?.name ?? "—"} />
            <Summary label="Especialidade" value={speciality || "—"} />
            <Summary label="Ordem" value={String(order)} />
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
          {isLast ? (pending ? "A guardar…" : "Guardar barbeiro") : "Seguinte →"}
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
