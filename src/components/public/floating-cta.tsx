"use client";

import { trackEvent } from "@/lib/analytics";
import type { UnitRow } from "@/types/database.types";
import { useT } from "@/components/public/locale-provider";

type Props = { unit: UnitRow };

export function FloatingCTA({ unit }: Props) {
  const { t } = useT();
  if (!unit.buk_url) return null;

  return (
    <a
      href={unit.buk_url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        trackEvent({
          type: "booking_click",
          unit_id: unit.id,
          meta: { source: "floating-cta" },
        })
      }
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-foreground px-5 py-3.5 text-sm font-medium text-background shadow-[0_16px_40px_-8px_rgba(0,0,0,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand hover:text-primary-foreground"
    >
      <span className="text-[17px] leading-none">✂</span>
      {t.cta.book} →
    </a>
  );
}
