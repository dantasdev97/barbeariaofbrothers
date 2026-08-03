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
export function siteUrl() {
  const explicit = process.env.SITE_URL; // override em runtime (usado pelo seo:check)
  if (explicit) return explicit.replace(/\/$/, "");

  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelEnv && vercelEnv !== "production" && vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return (process.env.NEXT_PUBLIC_SITE_URL ?? CANONICAL_ORIGIN).replace(/\/$/, "");
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
