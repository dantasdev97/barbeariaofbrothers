import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { Input } from "@/components/ui/input";
import { ClientsTable, type ClientRow } from "./clients-table";

type SearchParams = { q?: string; unit?: string };

export const dynamic = "force-dynamic";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { profile } = await requireRole(["super_admin", "manager"]);
  const canDelete = profile.role === "super_admin";
  const { q, unit } = await searchParams;
  const sb = createAdminClient();

  const [{ data: units }, { data: clients }] = await Promise.all([
    sb.from("units").select("id, name, slug").order("name"),
    (() => {
      let query = sb
        .from("clients")
        .select("id, name, phone, qr_token, unit_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (q) {
        query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);
      }
      if (unit) query = query.eq("unit_id", unit);
      return query;
    })(),
  ]);

  const unitNameById = new Map((units ?? []).map((u) => [u.id, u.name as string]));

  // Saldos totais por cliente (somando todas as unidades para preview)
  const ids = (clients ?? []).map((c) => c.id);
  const balances = new Map<string, number>();
  const lastVisitMap = new Map<string, string>();
  if (ids.length > 0) {
    const [{ data: bal }, { data: last }] = await Promise.all([
      sb.from("client_unit_balances").select("client_id, balance").in("client_id", ids),
      sb
        .from("loyalty_transactions")
        .select("client_id, created_at")
        .in("client_id", ids)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);
    for (const b of bal ?? []) {
      balances.set(b.client_id, (balances.get(b.client_id) ?? 0) + (b.balance ?? 0));
    }
    for (const t of last ?? []) {
      if (!lastVisitMap.has(t.client_id)) lastVisitMap.set(t.client_id, t.created_at as string);
    }
  }

  const rows: ClientRow[] = (clients ?? []).map((c) => {
    const last = lastVisitMap.get(c.id);
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      unitName: unitNameById.get(c.unit_id) ?? "—",
      points: balances.get(c.id) ?? 0,
      lastVisit: last
        ? new Date(last).toLocaleDateString("pt-PT", {
            day: "2-digit",
            month: "short",
          })
        : null,
    };
  });

  return (
    <div>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-[28px] font-semibold leading-none tracking-tight sm:text-[32px]">
            Clientes
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {(clients ?? []).length} cliente{(clients ?? []).length !== 1 ? "s" : ""} ·
            cartão fidelidade digital
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/admin/clientes/cartoes"
            className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-transparent px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
          >
            Exportar cartões
          </Link>
          <Link
            href="/admin/clientes/novo"
            className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-4 py-2.5 text-[13px] font-medium text-[#0e0a07] transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Novo cliente
          </Link>
        </div>
      </header>

      <form
        action="/admin/clientes"
        method="get"
        className="mb-5 flex flex-wrap items-center gap-2"
      >
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nome ou telefone…"
            className="pl-9"
          />
        </div>
        <select
          name="unit"
          defaultValue={unit ?? ""}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">Todas as unidades</option>
          {(units ?? []).map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-[#0e0a07]"
        >
          Buscar
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-border bg-bg-surface">
        <div className="hidden gap-3 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:grid md:grid-cols-[2fr_1.4fr_1fr_1fr_1fr_auto]">
          <div>Nome</div>
          <div>Telefone</div>
          <div>Unidade</div>
          <div>Pontos</div>
          <div>Última visita</div>
          <div className="text-right">Ações</div>
        </div>

        <ClientsTable rows={rows} canDelete={canDelete} />
      </div>
    </div>
  );
}
