import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";


export async function GET(
  _req: Request,
  { params }: { params: Promise<{ unit: string }> },
) {
  const { unit: slug } = await params;
  let name = "Barbearia Of Brothers";
  let tagline = "Since 2012";

  try {
    const sb = createAdminClient();
    const { data } = await sb
      .from("units")
      .select("name")
      .eq("slug", slug)
      .maybeSingle();
    if (data?.name) {
      name = data.name;
      tagline = "Corte · Barba · Estilo";
    }
  } catch {
    // fallback
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(135deg, #1D252B 0%, #111827 60%, #0b1115 100%)",
          color: "#ffffff",
          fontFamily: "system-ui",
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: 8,
            color: "#22c55e",
            textTransform: "uppercase",
          }}
        >
          {tagline}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          {name}
        </div>
        <div
          style={{
            marginTop: 36,
            display: "flex",
            gap: 12,
            alignItems: "center",
            color: "#9CA3AF",
            fontSize: 24,
          }}
        >
          <div
            style={{
              height: 12,
              width: 12,
              borderRadius: 999,
              background: "#22c55e",
            }}
          />
          barbeariaofbrothers.pt
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
