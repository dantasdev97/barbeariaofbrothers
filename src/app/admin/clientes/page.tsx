import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/page-header";
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
    // Só as unidades do programa: filtrar clientes por uma barbearia que não
    // tem cartão fidelidade não devolve nada e só confunde.
    sb.from("units").select("id, name, slug").eq("loyalty_active", true).order("name"),
    (() => {
      let query = sb
        .from("clients")
        .select("id, name, phone, email, auth_user_id, auth_provider, avatar_url, qr_token, unit_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      // O termo entra numa string de filtro do PostgREST, onde a vírgula
      // separa condições e os parêntesis agrupam: sem limpar, escrever uma
      // vírgula na busca altera ou parte a consulta.
      const safeQ = (q ?? "").replace(/[,()*\\%]/g, "").trim();
      if (safeQ) {
        // Email entra na procura: quem se regista pela Google não deixa
        // telefone, e sem isto não havia como encontrar essas pessoas.
        query = query.or(
          `name.ilike.%${safeQ}%,phone.ilike.%${safeQ}%,email.ilike.%${safeQ}%`,
        );
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
      email: c.email,
      // Criado pelo próprio, entrando com a Google — por oposição aos que o
      // barbeiro cadastrou à mão no painel.
      selfRegistered: !!c.auth_user_id,
      authProvider: c.auth_provider ?? null,
      avatarUrl: c.avatar_url ?? null,
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
      <PageHeader
        title="Clientes"
        description={`${(clients ?? []).length} cliente${
          (clients ?? []).length !== 1 ? "s" : ""
        } · cartão fidelidade digital`}
        actions={
          <>
            <Link
              href="/admin/clientes/novo"
              className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-4 py-2.5 text-[13px] font-medium text-[#0e0a07] transition-[opacity,transform] duration-150 ease-out-strong hover:opacity-90 active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" /> Novo cliente
            </Link>
          </>
        }
      />

      <form
        action="/admin/clientes"
        method="get"
        className="mb-5 flex flex-wrap items-center gap-2"
      >
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          {/* h-11 (44px) em todo o formulário: é o mínimo confortável para o
           * polegar, e o Input traz h-8 por omissão. */}
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nome, telefone ou email…"
            className="h-11 pl-9"
          />
        </div>
        <select
          name="unit"
          defaultValue={unit ?? ""}
          className="h-11 rounded-md border border-border bg-background px-3 text-sm"
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
          className="inline-flex h-11 items-center rounded-md bg-brand px-5 text-sm font-medium text-[#0e0a07] transition-[opacity,transform] duration-150 ease-out-strong hover:opacity-90 active:scale-[0.97]"
        >
          Buscar
        </button>
      </form>

      <ClientsTable rows={rows} canDelete={canDelete} />
    </div>
  );
}
