import "server-only";
import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // base32 sem chars ambíguos

export function generateQrToken(): string {
  const bytes = randomBytes(20);
  let token = "";
  for (let i = 0; i < bytes.length; i++) {
    token += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return token.slice(0, 16) + "-" + token.slice(16);
}

/** Sufixo aleatório de 4 chars para garantir unicidade do slug */
export function shortSuffix(): string {
  const bytes = randomBytes(4);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

/** "Augusto Dantas" → "augusto-dantas" (mesma lógica que o SQL) */
export function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos combinantes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export function generatePublicSlug(name: string): string {
  const base = slugifyName(name) || "cliente";
  return `${base}-${shortSuffix()}`;
}

export function cardUrl(handle: string, origin?: string): string {
  const base =
    origin ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://barbeariaofbrothers.pt";
  return `${base.replace(/\/$/, "")}/cliente/${handle}`;
}
