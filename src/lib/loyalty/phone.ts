/**
 * Números de telefone portugueses, do lado do cliente e do servidor.
 *
 * Sem `server-only`: o formulário valida enquanto se escreve e a acção valida
 * outra vez antes de gravar. A regra tem de ser a mesma nos dois lados, senão
 * o campo aceita e a gravação recusa — ou pior, o contrário.
 *
 * Guardamos sempre em formato internacional (`+351912345678`): é o que o
 * WhatsApp e as SMS precisam, e é o único formato em que dois registos do
 * mesmo número colidem no índice único da coluna. Guardar "912 345 678" e
 * "+351912345678" deixaria passar o mesmo número duas vezes.
 */

/** Só dígitos e um `+` inicial. */
function clean(raw: string): string {
  const trimmed = raw.trim().replace(/[\s.\-()/]/g, "");
  return trimmed.startsWith("+")
    ? `+${trimmed.slice(1).replace(/\D/g, "")}`
    : trimmed.replace(/\D/g, "");
}

/**
 * Normaliza para `+351XXXXXXXXX`, ou devolve `null` se não for um número
 * português utilizável.
 *
 * Aceita as formas que as pessoas escrevem de facto: `912345678`,
 * `912 345 678`, `+351 912 345 678`, `00351912345678`, `351912345678`.
 * Aceita fixos e móveis — quem só tem fixo também tem direito a ser
 * contactado.
 */
export function normalizePhonePT(raw: string): string | null {
  let digits = clean(raw);

  if (digits.startsWith("+351")) digits = digits.slice(4);
  else if (digits.startsWith("00351")) digits = digits.slice(5);
  else if (digits.startsWith("351") && digits.length === 12) digits = digits.slice(3);
  else if (digits.startsWith("+")) return null; // outro país: fora do âmbito

  if (!/^\d{9}$/.test(digits)) return null;
  // 2 = fixo, 3 = VoIP/serviços, 9 = móvel. Outros prefixos não existem em PT.
  if (!/^[239]/.test(digits)) return null;

  return `+351${digits}`;
}

/** `+351912345678` → `912 345 678`, para mostrar. */
export function formatPhonePTDisplay(value: string | null): string {
  if (!value) return "";
  const national = value.startsWith("+351") ? value.slice(4) : value;
  return /^\d{9}$/.test(national)
    ? national.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")
    : value;
}

/** Mensagem para quem escreveu um número que não serve. */
export const PHONE_HINT =
  "Escreva um número português de 9 dígitos (por exemplo 912 345 678).";
