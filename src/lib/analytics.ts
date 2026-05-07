import type { EventType } from "@/types/database.types";

type TrackPayload = {
  type: EventType;
  unit_id?: string | null;
  ref_id?: string | null;
  meta?: Record<string, unknown>;
};

/**
 * Browser-side event tracker. Fire-and-forget POST to /api/analytics.
 * Uses sendBeacon when available so it survives page navigations.
 */
export function trackEvent(payload: TrackPayload) {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
      return;
    }
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // best-effort, never block UI
  }
}
