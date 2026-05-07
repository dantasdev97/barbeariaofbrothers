"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { EventType } from "@/types/database.types";
import { trackEvent } from "@/lib/analytics";

type Props = {
  unitId?: string;
  type?: EventType;
  refId?: string | null;
  meta?: Record<string, unknown>;
};

/**
 * Drop-in client component that fires a single event on mount.
 * Use for page_view (default), product_view, barber_view.
 */
export function TrackPageView({
  unitId,
  type = "page_view",
  refId,
  meta,
}: Props) {
  const pathname = usePathname();
  useEffect(() => {
    trackEvent({
      type,
      unit_id: unitId,
      ref_id: refId,
      meta: { path: pathname, ...meta },
    });
    // run once per pathname change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  return null;
}
