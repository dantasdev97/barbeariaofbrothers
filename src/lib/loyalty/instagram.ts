/**
 * Normalização do @ de Instagram.
 *
 * Módulo próprio e não `client-actions.ts` por uma razão dura: num ficheiro
 * `"use server"` **todos** os exports têm de ser funções async, e esta é
 * síncrona — o build falha com "Server Actions must be async functions". Aqui
 * pode ser usada dos dois lados, como o `handle.ts` do QR.
 */

/**
 * Aceita `@nome`, `nome` e o URL completo do perfil colado do browser — é o que
 * as pessoas fazem na prática. A validação a sério está na RPC
 * `loyalty_grant_bonus`; isto só evita uma ida ao servidor para um valor que
 * nunca ia passar.
 */
export function normalizeInstagramHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?].*$/, "")
    .replace(/^@+/, "")
    .toLowerCase();
}
