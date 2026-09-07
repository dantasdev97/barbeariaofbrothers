import type { EventType } from "@/types/database.types";

/**
 * Tradução dos eventos analíticos para linguagem de painel.
 *
 * Os eventos chegam como `page_view` + `meta.path` — informação verdadeira mas
 * ilegível: a tabela de actividade mostrava "Visita" e oito caracteres de um
 * UUID, que não diz a ninguém que página foi vista nem que produto foi olhado.
 * Estas funções fazem a ponte entre o que a base guarda e o que o dono da
 * barbearia precisa de ler ao balcão.
 */

/** "oleo-de-barba" → "Oleo de barba" */
function humanize(slug: string): string {
  const s = slug.replace(/[-_]+/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : slug;
}

/**
 * Nome legível da página a partir do caminho.
 *
 * `unitSlugs` serve para distinguir `/of-brothers/produtos` (unidade +
 * secção) de `/programa` (página global): sem isso o primeiro segmento era
 * sempre tratado como unidade e páginas globais apareciam com o nome errado.
 */
export function pageLabelFromPath(
  path: string,
  unitSlugs?: Set<string>,
): string {
  const clean = path.split("?")[0].split("#")[0];
  const segs = clean.split("/").filter(Boolean);
  if (segs.length === 0) return "Página inicial";

  const inUnit = unitSlugs ? unitSlugs.has(segs[0]) : true;
  const rest = inUnit ? segs.slice(1) : segs;
  if (rest.length === 0) return "Página da unidade";

  const [head, tail] = rest;
  switch (head) {
    case "produtos":
      return tail ? `Produto · ${humanize(tail)}` : "Catálogo de produtos";
    case "barbeiros":
      return tail ? `Barbeiro · ${humanize(tail)}` : "Equipa";
    case "contato":
    case "contacto":
      return "Contactos";
    case "carrinho":
      return "Carrinho";
    case "agendar":
      return "Agendamento";
    case "programa":
      return "Programa de pontos";
    case "cliente":
      return "Cartão do cliente";
    case "minha-conta":
      return "Minha conta";
    default:
      return humanize(rest.join(" / "));
  }
}

/**
 * Nome curto da unidade.
 *
 * As duas barbearias chamam-se "Barbearia Of Brothers" e "Barbearia Of
 * Brothers 2": num crachá ou numa linha de lista, o que distingue uma da
 * outra é o fim do nome, e era exactamente o que o `truncate` cortava —
 * ficavam ambas "Barbearia…". Nomes sem este prefixo passam intactos.
 */
export function shortUnitName(name: string): string {
  return name.replace(/^barbearia\s+/i, "");
}

export type EventTone = "brand" | "green" | "blue" | "violet" | "mute";

/**
 * Como cada tipo de evento se apresenta: rótulo curto e cor.
 *
 * Curto a sério — o crachá vive ao lado do nome do produto, e "ADICIONOU AO
 * CARRINHO" deixava "Kit de …" para o nome no telemóvel.
 */
export const EVENT_META: Record<string, { label: string; tone: EventTone }> = {
  page_view: { label: "Visita", tone: "mute" },
  product_view: { label: "Produto", tone: "blue" },
  barber_view: { label: "Barbeiro", tone: "violet" },
  add_to_cart: { label: "Carrinho", tone: "brand" },
  whatsapp_checkout: { label: "WhatsApp", tone: "green" },
  booking_click: { label: "Agendamento", tone: "green" },
  loyalty_click: { label: "Pontos", tone: "brand" },
};

export function eventMeta(type: EventType | string) {
  return EVENT_META[type] ?? { label: type, tone: "mute" as EventTone };
}

/** Classes do crachá por tom. Literais, para o Tailwind as encontrar. */
export const TONE_CHIP: Record<EventTone, string> = {
  brand: "bg-brand/12 text-brand",
  green: "bg-emerald-500/12 text-emerald-600",
  blue: "bg-blue-500/12 text-blue-600",
  violet: "bg-violet-500/12 text-violet-600",
  mute: "bg-muted text-muted-foreground",
};
