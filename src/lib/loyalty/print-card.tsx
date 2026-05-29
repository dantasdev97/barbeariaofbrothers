import "server-only";
import { cardUrl } from "@/lib/loyalty/qr";

/**
 * Gera o HTML imprimível de uma folha A4 com cartões 85×54mm (tamanho cartão
 * de crédito). O utilizador imprime para PDF via diálogo do browser.
 *
 * QR codes são embutidos como SVG inline gerados server-side com qrcode-svg.
 */
type ClientLite = { id: string; name: string; qr_token: string };

// Algoritmo QR mínimo embutido — usamos a lib "qrcode" via dynamic import só
// se disponível; caso contrário, renderizamos como imagem via API serverless.
// Para evitar dependência runtime no build, optamos pela rota canônica:
// gerar o data-URL no momento da renderização do RSC.
import QRCode from "qrcode";

async function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#0A0A0A", light: "#F5F5F0" },
  });
}

export async function renderPrintSheet(
  clients: ClientLite[],
  opts?: { origin?: string },
): Promise<string> {
  const items = await Promise.all(
    clients.map(async (c) => {
      const url = cardUrl(c.qr_token, opts?.origin);
      const svg = await qrSvg(url);
      return { ...c, url, svg };
    }),
  );

  // 8 cartões por A4 (4 linhas × 2 colunas) cabem confortavelmente
  const css = `
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #f3f3f3; color: #0A0A0A;
      font-family: 'Inter', -apple-system, system-ui, sans-serif; }
    .sheet {
      display: grid;
      grid-template-columns: 85mm 85mm;
      grid-auto-rows: 54mm;
      gap: 6mm;
      padding: 0;
      page-break-inside: avoid;
    }
    .card {
      width: 85mm; height: 54mm;
      background: #0A0A0A; color: #F5F5F0;
      border-radius: 3mm;
      padding: 5mm;
      display: grid;
      grid-template-columns: 1fr 22mm;
      gap: 4mm;
      align-items: center;
      page-break-inside: avoid;
      box-shadow: inset 0 0 0 0.3mm #C9A84C;
    }
    .brand {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 14pt; font-weight: 700; letter-spacing: 0.5px;
      color: #C9A84C;
    }
    .tagline {
      font-size: 6.5pt; letter-spacing: 1.4pt; text-transform: uppercase;
      color: #F5F5F0; opacity: 0.8; margin-top: 1mm;
    }
    .name {
      font-size: 10pt; font-weight: 600;
      margin-top: 6mm;
      color: #F5F5F0;
    }
    .name small { display:block; font-size: 6.5pt; letter-spacing: 1.2pt;
      text-transform: uppercase; color:#C9A84C; opacity:.9; margin-bottom: 1mm; }
    .qrwrap { background: #F5F5F0; border-radius: 2mm; padding: 1.5mm; }
    .qrwrap svg { display: block; width: 19mm; height: 19mm; }
    .ofb {
      text-align: center; font-size: 5pt; letter-spacing: 1.2pt;
      text-transform: uppercase; color: #C9A84C;
      margin-top: 1mm;
    }
    @media print { body { background: white; } }
  `;

  const cards = items
    .map(
      (it) => `
      <div class="card">
        <div>
          <div class="brand">Of Brothers</div>
          <div class="tagline">Cartão Fidelidade</div>
          <div class="name"><small>Cliente</small>${escapeHtml(it.name)}</div>
        </div>
        <div>
          <div class="qrwrap">${it.svg}</div>
          <div class="ofb">scan p/ saldo</div>
        </div>
      </div>`,
    )
    .join("\n");

  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"/>
  <title>Cartões Of Brothers — impressão</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet"/>
  <style>${css}</style></head>
  <body><div class="sheet">${cards}</div></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
