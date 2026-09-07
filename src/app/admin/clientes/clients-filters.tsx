"use client";

import { useState } from "react";
import {
  SearchField,
  useQueryNavigation,
} from "@/components/admin/search-field";

type UnitOption = { id: string; name: string };

/**
 * Busca e filtro de unidade da lista de clientes.
 *
 * Era um formulário com um botão "Buscar" laranja: escrever o nome, tirar a
 * mão do teclado, tocar no botão. Agora procura sozinho enquanto se escreve
 * e o filtro de unidade aplica-se ao ser mudado — o botão deixou de ter o que
 * fazer. O `<form method="get">` fica de pé por baixo, para o Enter continuar
 * a funcionar mesmo sem JavaScript.
 */
export function ClientsFilters({
  q,
  unit,
  units,
}: {
  q: string;
  unit: string;
  units: UnitOption[];
}) {
  const { go, pending } = useQueryNavigation("/admin/clientes");
  const [term, setTerm] = useState(q);
  const [unitId, setUnitId] = useState(unit);

  // A página volta sempre à primeira ao mudar de filtro: estar na página 3 de
  // "todos" e passar a "Of Brothers 2" dava uma lista vazia com paginação.
  function search(nextTerm: string, nextUnit: string, debounce: boolean) {
    go({ q: nextTerm, unit: nextUnit }, { debounce });
  }

  return (
    <form
      action="/admin/clientes"
      method="get"
      role="search"
      aria-label="Procurar clientes"
      className="mb-4 flex flex-wrap items-center gap-2"
    >
      <SearchField
        id="clientes-q"
        label="Buscar por nome, telefone ou email"
        placeholder="Buscar por nome, telefone ou email…"
        value={term}
        pending={pending}
        onValueChange={(value) => {
          setTerm(value);
          search(value, unitId, true);
        }}
        onClear={() => {
          setTerm("");
          search("", unitId, false);
        }}
        className="min-w-[220px] flex-1"
      />

      <label htmlFor="clientes-unit" className="sr-only">
        Filtrar por unidade
      </label>
      <select
        id="clientes-unit"
        name="unit"
        value={unitId}
        onChange={(e) => {
          setUnitId(e.target.value);
          search(term, e.target.value, false);
        }}
        className="h-11 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <option value="">Todas as unidades</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </form>
  );
}
