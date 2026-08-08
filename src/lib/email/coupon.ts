import "server-only";
import type { LoyaltyCouponRow } from "@/types/database.types";
import { formatRewardValue } from "@/lib/loyalty/rewards";

/**
 * Envio do cupom por email, via Resend.
 *
 * **Sem `RESEND_API_KEY` isto é um no-op deliberado.** O resgate já
 * aconteceu e o cupom já existe na base — falhar aqui só serviria para
 * tirar pontos ao cliente por causa de uma chave em falta. O código no ecrã
 * é a fonte de verdade; o email é conveniência.
 *
 * Para activar: criar conta no Resend, verificar o domínio, e pôr
 * `RESEND_API_KEY` (e opcionalmente `RESEND_FROM`) nas variáveis do projeto.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendCouponEmail({
  to,
  clientName,
  unitName,
  coupon,
}: {
  to: string;
  clientName: string;
  unitName: string;
  coupon: LoyaltyCouponRow;
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY não configurada" };
  }

  const from = process.env.RESEND_FROM ?? "Of Brothers <cartao@barbeariaofbrothers.pt>";
  const value = formatRewardValue(coupon.reward_kind, coupon.value_cents, coupon.percent);
  const expires = coupon.expires_at
    ? new Date(coupon.expires_at).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `O seu cupom: ${coupon.reward_label}`,
      html: couponHtml({ clientName, unitName, coupon, value, expires }),
      text: couponText({ clientName, unitName, coupon, value, expires }),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return { sent: false, reason: `Resend ${response.status}: ${body.slice(0, 200)}` };
  }

  return { sent: true };
}

type TemplateInput = {
  clientName: string;
  unitName: string;
  coupon: LoyaltyCouponRow;
  value: string | null;
  expires: string | null;
};

/**
 * HTML de email com tabelas e estilos inline — não é descuido, é o que os
 * clientes de email (sobretudo o Outlook) sabem renderizar. Flexbox, grid e
 * folhas de estilo externas não são de confiança aqui.
 */
function couponHtml({ clientName, unitName, coupon, value, expires }: TemplateInput) {
  const firstName = clientName.split(" ")[0];
  return `<!doctype html>
<html lang="pt">
<body style="margin:0;padding:0;background:#f5f2ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#1a1410;padding:28px 32px;">
          <p style="margin:0;color:#F39200;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Barbearia Of Brothers</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:600;line-height:1.2;">O seu cupom está pronto</h1>
        </td></tr>

        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;color:#1a1410;font-size:16px;line-height:1.5;">
            Olá ${escapeHtml(firstName)}, resgatou <strong>${escapeHtml(coupon.reward_label)}</strong>${value ? ` (${escapeHtml(value)})` : ""} por ${coupon.points_spent} pontos.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;border-radius:12px;border:2px dashed #e0d9cf;">
            <tr><td align="center" style="padding:24px 16px;">
              <p style="margin:0 0 8px;color:#6b6560;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Código do cupom</p>
              <p style="margin:0;color:#1a1410;font-size:26px;font-weight:700;letter-spacing:2px;font-family:'SF Mono',Menlo,Consolas,monospace;">${escapeHtml(coupon.code)}</p>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;color:#6b6560;font-size:14px;line-height:1.6;">
            Mostre ou diga este código ao barbeiro em <strong style="color:#1a1410;">${escapeHtml(unitName)}</strong>.
            ${expires ? `Válido até <strong style="color:#1a1410;">${escapeHtml(expires)}</strong>.` : ""}
          </p>
          <p style="margin:16px 0 0;color:#9c958e;font-size:12px;line-height:1.6;">
            O cupom só pode ser usado uma vez. Fica também guardado no seu cartão digital.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function couponText({ clientName, unitName, coupon, value, expires }: TemplateInput) {
  const firstName = clientName.split(" ")[0];
  return [
    `Olá ${firstName},`,
    ``,
    `Resgatou ${coupon.reward_label}${value ? ` (${value})` : ""} por ${coupon.points_spent} pontos.`,
    ``,
    `CÓDIGO DO CUPOM: ${coupon.code}`,
    ``,
    `Mostre ou diga este código ao barbeiro em ${unitName}.`,
    expires ? `Válido até ${expires}.` : "",
    `O cupom só pode ser usado uma vez.`,
    ``,
    `Barbearia Of Brothers`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** O nome do cliente e o rótulo da recompensa vêm da base — nunca confiar. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
