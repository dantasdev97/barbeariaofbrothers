import "server-only";
import { randomBytes } from "node:crypto";
import { siteUrl } from "@/lib/utils";

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

/**
 * Endereço público do cartão de um cliente — o que o QR code codifica.
 *
 * A origem vem do `siteUrl()` e não do `NEXT_PUBLIC_SITE_URL` em cru: o
 * recurso era o domínio sem `www`, que na Vercel redirecciona para o `www` —
 * um salto a mais em cada leitura de QR, e um endereço diferente do
 * canónico do site. O `siteUrl()` também acerta nos deploys de pré-visualização,
 * onde o QR passa a apontar para o próprio preview em vez de produção.
 */
export function cardUrl(handle: string, origin?: string): string {
  const base = origin ?? siteUrl();
  return `${base.replace(/\/$/, "")}/cliente/${handle}`;
}
