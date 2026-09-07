"use client";

import { useState } from "react";
import {
  SearchField,
  useQueryNavigation,
} from "@/components/admin/search-field";

/**
 * Busca de cliente na operação.
 *
 * É o plano B do scanner: quando o cliente não traz o QR, o barbeiro escreve
 * o nome. Procura enquanto se escreve porque é aqui que a pressa é maior —
 * há alguém à espera do outro lado do balcão.
 */
export function ClientSearch({ q }: { q: string }) {
  const { go, pending } = useQueryNavigation("/admin/operacao");
  const [term, setTerm] = useState(q);

  return (
    <form
      action="/admin/operacao"
      method="get"
      role="search"
      aria-label="Procurar cliente"
      className="mb-3"
    >
      <SearchField
        id="operacao-q"
        label="Buscar cliente por nome, telefone ou email"
        placeholder="Buscar por nome, telefone ou email…"
        value={term}
        pending={pending}
        autoFocus={!q}
        onValueChange={(value) => {
          setTerm(value);
          go({ q: value }, { debounce: true });
        }}
        onClear={() => {
          setTerm("");
          go({});
        }}
      />
    </form>
  );
}
