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

export function absoluteUrl(path: string) {
  const base =
    process.env.SITE_URL ??              // servidor — lida em runtime (não precisa rebuild)
    process.env.NEXT_PUBLIC_SITE_URL ??  // cliente — injetada no build
    "https://barbeariaofbrothers.pt";    // fallback de produção
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function formatPhonePT(phone: string | null | undefined) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 9) return digits.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
  if (digits.length === 12) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, "+$1 $2 $3 $4");
  return phone;
}
