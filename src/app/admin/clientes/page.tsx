import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Plus, Search, X } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { ClientsTable, type ClientRow } from "./clients-table";

type SearchParams = { q?: string; unit?: string; page?: string };

export const dynamic = "force-dynamic";

/** O que sempre existiu. Pedir só isto nunca falha por causa de migrações. */
const BASE_COLS =
  "id, name, phone, email, auth_user_id, qr_token, unit_id, created_at";
/** Origem da conta e foto — colunas da 0012. */
const IDENTITY_COLS = `${BASE_COLS}, auth_provider, avatar_url`;

/**
 * Clientes por página.
 *
 * A lista pedia 200 de uma vez e desenhava-os todos: no telemóvel eram uns
 * 38 mil pixels de scroll e 200 avatares a carregar. 20 chega para um ecrã
 * de desktop sem paginar à toa.
 */
const PAGE_SIZE = 20;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { profile } = await requireRole(["super_admin", "manager"]);
  const canDelete = profile.role === "super_admin";
  const { q, unit, page: pageParam } = await searchParams;
  const sb = createAdminClient();

  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  // O termo entra numa string de filtro do PostgREST, onde a vírgula separa
  // condições e os parêntesis agrupam: sem limpar, escrever uma vírgula na
  // busca altera ou parte a consulta.
  const safeQ = (q ?? "").replace(/[,()*\\%]/g, "").trim();

  const clientsQuery = (cols: string) => {
    let query = sb
      // `count: "exact"` num pedido paginado devolve o total real numa só
      // ida ao servidor — é o que permite dizer "21–40 de 62" e saber
      // quantas páginas existem.
      .from("clients")
      .select(cols, { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (safeQ) {
      // Email entra na procura: quem se regista pela Google não deixa
      // telefone, e sem isto não havia como encontrar essas pessoas.
      query = query.or(
        `name.ilike.%${safeQ}%,phone.ilike.%${safeQ}%,email.ilike.%${safeQ}%`,
      );
    }
    if (unit) query = query.eq("unit_id", unit);
    return query;
  };

  const [unitsRes, clientsRes] = await Promise.all([
    // Só as unidades do programa: filtrar clientes por uma barbearia que não
    // tem cartão fidelidade não devolve nada e só confunde.
    sb.from("units").select("id, name, slug").eq("loyalty_active", true).order("name"),
    clientsQuery(IDENTITY_COLS),
  ]);

  // Uma consulta falhada devolve `data` a null, e um `?? []` a seguir dá uma
  // lista vazia indistinguível de "não há clientes" — o ecrã convidava a
  // cadastrar o primeiro enquanto os clientes estavam todos lá. Foi o que
  // aconteceu quando esta página passou a pedir colunas que a migração ainda
  // não tinha criado. Duas defesas: recuar para as colunas antigas, para a
  // lista aparecer de qualquer maneira, e dizer em voz alta o que falta.
  // `.select()` com uma string variável impede o Supabase de inferir a forma
  // das linhas; o tipo real é declarado abaixo, em `ClientRecord`.
  let clients = clientsRes.data as unknown[] | null;
  let total = clientsRes.count ?? 0;
  let migrationPending = false;
  if (clientsRes.error) {
    console.error("[admin/clientes] identidade", clientsRes.error);
    const fallback = await clientsQuery(BASE_COLS);
    if (fallback.error) {
      console.error("[admin/clientes] base", fallback.error);
      throw new Error(fallback.error.message);
    }
    clients = fallback.data as unknown[];
    total = fallback.count ?? 0;
    migrationPending = true;
  }

  let units = unitsRes.data;
  if (unitsRes.error) {
    // `loyalty_active` chegou na 0011. Sem unidades o seletor fica vazio e a
    // coluna "Unidade" mostra "—" em toda a gente.
    console.error("[admin/clientes] unidades", unitsRes.error);
    const fallback = await sb.from("units").select("id, name, slug").order("name");
    units = fallback.data;
    migrationPending = true;
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Página pedida à mão além do fim: mostrar "nenhum cliente encontrado" com
  // 62 clientes na base seria mentira. Vai para a última página real.
  if (page > pageCount && total > 0) {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (unit) qs.set("unit", unit);
    if (pageCount > 1) qs.set("page", String(pageCount));
    redirect(`/admin/clientes${qs.toString() ? `?${qs}` : ""}`);
  }

  const unitNameById = new Map((units ?? []).map((u) => [u.id, u.name as string]));

  type ClientRecord = {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    auth_user_id: string | null;
    unit_id: string;
    // Ausentes quando se recuou para as colunas base.
    auth_provider?: string | null;
    avatar_url?: string | null;
  };
  const list = (clients ?? []) as unknown as ClientRecord[];

  // Saldos totais por cliente (somando todas as unidades para preview)
  const ids = list.map((c) => c.id);
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

  const rows: ClientRow[] = list.map((c) => {
    const last = lastVisitMap.get(c.id);
    const lastDate = last ? new Date(last) : null;
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
      // Sem a 0012 não há como distinguir Google de formulário: mais vale não
      // mostrar crachá nenhum do que mostrar "Formulário" a toda a gente.
      showOrigin: !migrationPending,
      unitName: unitNameById.get(c.unit_id) ?? "—",
      points: balances.get(c.id) ?? 0,
      // Formatado no servidor de propósito: formatar no cliente com o fuso
      // do browser dava uma data diferente da do servidor e a hidratação
      // acusava.
      lastVisit: lastDate
        ? lastDate.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })
        : null,
      lastVisitFull: lastDate
        ? lastDate.toLocaleDateString("pt-PT", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : null,
    };
  });

  const filtered = !!safeQ || !!unit;
  const activeUnitName = unit ? unitNameById.get(unit) : undefined;

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={
          <>
            {total} cliente{total !== 1 ? "s" : ""}
            {activeUnitName ? ` em ${activeUnitName}` : ""} · cartão fidelidade
            digital
          </>
        }
        actions={
          <Link
            href="/admin/clientes/novo"
            className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-4 py-2.5 text-[13px] font-medium text-[#0e0a07] transition-[opacity,transform] duration-150 ease-out-strong hover:opacity-90 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" /> Novo cliente
          </Link>
        }
      />

      {migrationPending && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-[13px]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-foreground">
            <strong className="font-semibold">Migração em falta.</strong> A lista
            está completa, mas falta correr a migração mais recente no Supabase —
            até lá não se vê de onde veio cada conta (Google ou formulário) nem a
            foto de perfil.
          </p>
        </div>
      )}

      {/* `role="search"` marca a região para quem navega por landmarks; os
       * rótulos existem para leitores de ecrã mesmo sem estarem à vista (um
       * `placeholder` não é rótulo — desaparece assim que se escreve). */}
      <form
        action="/admin/clientes"
        method="get"
        role="search"
        aria-label="Procurar clientes"
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        <div className="relative min-w-[220px] flex-1">
          <label htmlFor="clientes-q" className="sr-only">
            Buscar por nome, telefone ou email
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          {/* h-11 (44px) em todo o formulário: é o mínimo confortável para o
           * polegar, e o Input traz h-8 por omissão. */}
          <Input
            id="clientes-q"
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Buscar por nome, telefone ou email…"
            className="h-11 pl-9"
          />
        </div>
        <label htmlFor="clientes-unit" className="sr-only">
          Filtrar por unidade
        </label>
        <select
          id="clientes-unit"
          name="unit"
          defaultValue={unit ?? ""}
          className="h-11 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
          className="inline-flex h-11 items-center rounded-md bg-brand px-5 text-sm font-medium text-[#0e0a07] transition-[opacity,transform] duration-150 ease-out-strong hover:opacity-90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Buscar
        </button>
        {filtered && (
          <Link
            href="/admin/clientes"
            className="inline-flex h-11 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X className="h-4 w-4" /> Limpar
          </Link>
        )}
      </form>

      <ClientsTable rows={rows} canDelete={canDelete} showUnit={!unit} />

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={PAGE_SIZE}
        basePath="/admin/clientes"
        params={{ q: safeQ || undefined, unit }}
        noun={["cliente", "clientes"]}
      />
    </div>
  );
}
