import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number, currency: "EUR" | "BRL" = "EUR") {
  const locale = currency === "EUR" ? "pt-PT" : "pt-BR";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatPriceOrAsk(cents: number, currency: "EUR" | "BRL" = "EUR") {
  return cents > 0 ? formatPrice(cents, currency) : "Sob consulta";
}

export function slugify(text: string) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

/**
 * Host canónico do site. O apex (barbeariaofbrothers.pt) redireciona para `www`
 * na Vercel, por isso tudo o que é indexável — canonicals, OG, sitemap, JSON-LD —
 * tem de apontar para `www`. Apontar para o apex faz o Google seguir um redirect
 * a partir do URL que declarámos como canónico, e os sinais não consolidam.
 */
export const CANONICAL_ORIGIN = "https://www.barbeariaofbrothers.pt";

/**
 * Origem a usar em tudo o que é absoluto (canonicals, OG, sitemap, JSON-LD).
 *
 * A verificação de preview vem **antes** de `NEXT_PUBLIC_SITE_URL` de propósito:
 * se essa variável for definida a nível de projeto na Vercel em vez de só em
 * Production, cada deploy de preview passaria a declarar canonicals de produção
 * e a competir com o site real no índice.
 */
/**
 * Normaliza um valor de origem vindo de variável de ambiente.
 *
 * Estas variáveis são escritas à mão no painel da Vercel, por isso são o ponto
 * mais provável de erro humano. Um valor sem esquema (`www.exemplo.pt`) fazia o
 * `new URL()` do `metadataBase` rebentar e **falhava o build inteiro** — um
 * gralha no painel não deve poder deitar o site abaixo.
 *
 * Devolve `null` quando não dá para aproveitar nada, para o chamador cair no
 * fallback.
 */
function normalizeOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "");
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    console.warn(
      `[siteUrl] Origem inválida na configuração: "${value}". A usar ${CANONICAL_ORIGIN}.`,
    );
    return null;
  }
}

export function siteUrl() {
  // override em runtime (usado pelo seo:check)
  const explicit = normalizeOrigin(process.env.SITE_URL);
  if (explicit) return explicit;

  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
  const preview =
    vercelEnv && vercelEnv !== "production"
      ? normalizeOrigin(process.env.NEXT_PUBLIC_VERCEL_URL)
      : null;
  if (preview) return preview;

  return normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ?? CANONICAL_ORIGIN;
}

export function absoluteUrl(path: string) {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function formatPhonePT(phone: string | null | undefined) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 9) return digits.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
  if (digits.length === 12) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, "+$1 $2 $3 $4");
  return phone;
}
