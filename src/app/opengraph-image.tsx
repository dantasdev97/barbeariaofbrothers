import { ImageResponse } from "next/og";

/**
 * Imagem OG da homepage.
 *
 * Substitui o antigo `/og-image.png`, que estava declarado no root layout mas
 * nunca existiu em `public/` — o URL devolvia 404, portanto a homepage e todas
 * as páginas que herdavam o OG do root ficavam sem preview social.
 *
 * Gerada em vez de commitada para não guardar um binário no repositório, e
 * mantém o mesmo desenho de `/api/og/[unit]`.
 */
export const alt = "Barbearia Of Brothers — Barbearia em Leiria desde 2012";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          Desde 2012
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 88,
            fontWeight: 700,
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          Barbearia em Leiria
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
          Of Brothers · barbeariaofbrothers.pt
        </div>
      </div>
    ),
    size,
  );
}
