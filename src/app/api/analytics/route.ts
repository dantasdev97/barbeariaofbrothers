import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EventType, Json } from "@/types/database.types";


const VALID_TYPES = new Set<EventType>([
  "page_view",
  "booking_click",
  "product_view",
  "barber_view",
  "whatsapp_checkout",
  "add_to_cart",
]);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse("invalid", { status: 400 });
  }
  const data = body as {
    type?: string;
    unit_id?: string | null;
    ref_id?: string | null;
    meta?: Record<string, unknown>;
  };

  if (!data.type || !VALID_TYPES.has(data.type as EventType)) {
    return new NextResponse("bad type", { status: 400 });
  }

  try {
    const sb = createAdminClient();
    await sb.from("events").insert({
      type: data.type as EventType,
      unit_id: data.unit_id ?? null,
      ref_id: data.ref_id ?? null,
      meta: (data.meta ?? null) as Json,
    });
  } catch (e) {
    // Never break the page on analytics failure
    console.error("[analytics]", e);
  }
  return new NextResponse(null, { status: 204 });
}
