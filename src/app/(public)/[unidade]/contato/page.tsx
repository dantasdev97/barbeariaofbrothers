import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { getUnitBySlug } from "@/lib/data";
import { buildUnitMetadata } from "@/lib/seo";
import { TrackPageView } from "@/components/public/track-page-view";
import { BookingButton } from "@/components/public/booking-button";
import { formatPhonePT } from "@/lib/utils";

type Params = { unidade: string };

const DAYS = [
  ["mon", "Segunda"],
  ["tue", "Terça"],
  ["wed", "Quarta"],
  ["thu", "Quinta"],
  ["fri", "Sexta"],
  ["sat", "Sábado"],
  ["sun", "Domingo"],
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { unidade } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) return {};
  return buildUnitMetadata(unit, {
    title: `Contacto — ${unit.name}`,
    description: `Morada, horários e contactos de ${unit.name}.`,
    path: `/${unit.slug}/contato`,
  });
}

export default async function ContatoPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { unidade } = await params;
  const unit = await getUnitBySlug(unidade);
  if (!unit) notFound();

  return (
    <>
      <TrackPageView unitId={unit.id} />
      <section className="container-page py-12 sm:py-16">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs uppercase tracking-[0.2em] text-brand">
            Contacto
          </span>
          <h1 className="mt-2 font-heading text-4xl font-semibold sm:text-5xl">
            Como nos encontrar
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6 rounded-3xl border border-white/10 bg-bg-surface p-6 sm:p-8">
            <div>
              <h3 className="mb-1 font-heading text-sm uppercase tracking-wider">
                Morada
              </h3>
              {unit.address ? (
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {unit.address}
                </p>
              ) : (
                <p className="text-muted-foreground">A definir.</p>
              )}
              {unit.maps_url && (
                <a
                  href={unit.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-brand hover:underline"
                >
                  Ver no mapa →
                </a>
              )}
            </div>

            <div>
              <h3 className="mb-1 font-heading text-sm uppercase tracking-wider">
                Telefone
              </h3>
              {unit.phone ? (
                <a
                  href={`tel:${unit.phone}`}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-brand"
                >
                  <Phone className="h-4 w-4 text-brand" />
                  {formatPhonePT(unit.phone)}
                </a>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </div>

            <div>
              <h3 className="mb-1 font-heading text-sm uppercase tracking-wider">
                WhatsApp
              </h3>
              {unit.whatsapp ? (
                <a
                  href={`https://wa.me/${unit.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-brand"
                >
                  <MessageCircle className="h-4 w-4 text-brand" />
                  Falar agora
                </a>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </div>

            <div className="pt-4">
              <BookingButton unit={unit} className="w-full px-6 py-6 text-base" />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-bg-surface p-6 sm:p-8">
            <h3 className="mb-4 flex items-center gap-2 font-heading text-sm uppercase tracking-wider">
              <Clock className="h-4 w-4 text-brand" /> Horário
            </h3>
            <ul className="divide-y divide-white/5">
              {DAYS.map(([key, label]) => {
                const slot = unit.hours?.[key];
                return (
                  <li key={key} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-foreground">{label}</span>
                    <span className="text-sm text-muted-foreground">
                      {slot?.open && slot?.close
                        ? `${slot.open} – ${slot.close}`
                        : "Fechado"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
