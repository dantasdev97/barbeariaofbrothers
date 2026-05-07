"use client";

import { Calendar } from "lucide-react";
import type { BarberRow, UnitRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Props = {
  unit: UnitRow;
  barber?: BarberRow;
  className?: string;
  label?: string;
};

export function BookingButton({ unit, barber, className, label }: Props) {
  const href = barber?.buk_url ?? unit.buk_url;
  if (!href) return null;

  const text =
    label ?? (barber ? `Agendar com ${barber.name.split(" ")[0]}` : "Agendar agora");

  return (
    <Button
      asChild
      size="lg"
      className={cn(
        "bg-brand text-primary-foreground shadow-premium hover:bg-brand-hover",
        className,
      )}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackEvent({
            type: "booking_click",
            unit_id: unit.id,
            ref_id: barber?.id ?? null,
            meta: { source: barber ? "barber-card" : "page" },
          })
        }
      >
        <Calendar className="mr-2 h-4 w-4" />
        {text}
      </a>
    </Button>
  );
}
