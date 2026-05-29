import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { renderPrintSheet } from "@/lib/loyalty/print-card";

export async function GET(req: NextRequest) {
  await requireRole(["super_admin", "manager"]);
  const url = new URL(req.url);
  const idsParam = url.searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ error: "no ids" }, { status: 400 });
  }

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("clients")
    .select("id, name, qr_token")
    .in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const html = await renderPrintSheet(
    (data ?? []).map((c) => ({ id: c.id, name: c.name, qr_token: c.qr_token })),
    { origin: url.origin },
  );

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
