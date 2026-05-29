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

export function cardUrl(token: string, origin?: string): string {
  const base =
    origin ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://barbeariaofbrothers.pt";
  return `${base.replace(/\/$/, "")}/cliente/${token}`;
}
