/**
 * Parsing do "handle" de um cartão fidelidade.
 *
 * Sem `server-only`: o scanner é um Client Component e precisa da mesma lógica
 * que as Server Actions, senão o QR é interpretado de forma diferente nos dois
 * lados. Antes esta regex estava duplicada em três sítios.
 *
 * Um handle é um `public_slug` (`augusto-dantas-J2VV`) ou um `qr_token`
 * (`J2VVQ5PZY3QSXH7V-Z46T`). O QR codifica o URL completo do cartão, mas
 * aceitamos também o handle colado à mão.
 */
export function extractHandle(value: string): string {
  const raw = value.trim();
  // `/cliente/<handle>`, ignorando query string / fragmento / barra final
  const match = raw.match(/cliente\/([A-Za-z0-9-]+)/);
  return (match?.[1] ?? raw).trim();
}
