import type { CartItem, UnitRow } from "@/types/database.types";
import { formatPrice } from "@/lib/utils";

export function buildCheckoutMessage(items: CartItem[], unit: UnitRow): string {
  const lines: string[] = [];
  lines.push("Olá 👋");
  lines.push("");
  lines.push("Gostaria de comprar:");
  lines.push("");

  let total = 0;
  for (const item of items) {
    const subtotal = item.price_cents * item.quantity;
    total += subtotal;
    lines.push(
      `🛍️ ${item.quantity}× ${item.name} — ${formatPrice(item.price_cents)}`,
    );
  }

  lines.push("");
  lines.push(`💶 Total: ${formatPrice(total)}`);
  lines.push("");
  lines.push(`📍 Unidade: ${unit.name}`);
  if (unit.address) lines.push(`📌 Morada: ${unit.address}`);
  lines.push("");
  lines.push("Pode confirmar disponibilidade? Obrigado!");

  return lines.join("\n");
}

export function buildSingleProductMessage(
  product: { name: string; price_cents: number },
  unit: UnitRow,
): string {
  return [
    "Olá 👋",
    "",
    "Gostaria de comprar:",
    "",
    `🛍️ Produto: ${product.name}`,
    `💶 Preço: ${formatPrice(product.price_cents)}`,
    "",
    `📍 Unidade: ${unit.name}`,
    "",
    "Pode confirmar disponibilidade?",
  ].join("\n");
}

export function whatsappLink(phoneOrNumber: string, message: string) {
  const digits = phoneOrNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
