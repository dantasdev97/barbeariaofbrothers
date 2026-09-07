import Link from "next/link";
import { ScanLine, UserSearch } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { PageHeader } from "@/components/admin/page-header";
import { ClientAvatar } from "@/components/admin/client-avatar";
import { slugify } from "@/lib/utils";
import { CouponCheck } from "./coupon-check";
import { ClientSearch } from "./client-search";
import { staggerIndex } from "@/lib/motion";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string };

type Result = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  qr_token: string;
  avatar_url?: string | null;
};

/** Colunas de identidade (migração 0012). Ver o recuo em `search()`. */
const RESULT_COLS = "id, name, phone, email, qr_token, avatar_url";
const RESULT_COLS_BASE = "id, name, phone, email, qr_token";

export default async function OperacaoLanding({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { profile } = await requireRole(["super_admin", "manager", "barbeiro"]);
  const { q } = await searchParams;
  const sb = createAdminClient();

  // A vírgula separa condições no filtro do PostgREST e os parêntesis agrupam:
  // sem limpar, escrever uma vírgula na busca altera ou parte a consulta.
  const term = (q ?? "").replace(/[,()*\\%]/g, "").trim();

  // Um slug vazio daria `ilike.%%`, que casa com tudo: procurar "@" devolvia
  // a lista inteira em vez de nenhum resultado.
  const slugTerm = slugify(term);

  let results: Result[] = [];
  if (term.length >= 2) {
    const search = (cols: string) =>
      sb
        .from("clients")
        .select(cols)
        // Email e slug entram na procura: quem se regista pela Google não
        // deixa telefone, e o `ilike` distingue "joao" de "João" — o
        // `public_slug` é o nome já sem acentos, e é por aí que se apanha
        // quem escreve depressa.
        .or(
          [
            `name.ilike.%${term}%`,
            `phone.ilike.%${term}%`,
            `email.ilike.%${term}%`,
            ...(slugTerm ? [`public_slug.ilike.%${slugTerm}%`] : []),
          ].join(","),
        )
        .order("name")
        .limit(20);

    const res = await search(RESULT_COLS);
    if (res.error) {
      // Sem a migração da foto, a consulta falha inteira e o barbeiro fica
      // sem busca nenhuma. Melhor a lista sem fotos do que lista nenhuma.
      console.error("[admin/operacao] busca com identidade", res.error);
      const fallback = await search(RESULT_COLS_BASE);
      results = (fallback.data ?? []) as unknown as Result[];
    } else {
      results = (res.data ?? []) as unknown as Result[];
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader
        title="Operação"
        description={
          profile.role === "barbeiro"
            ? "Lança serviços e resgates dos clientes."
            : "Painel operacional."
        }
      />

      {/* Acção primária do dia-a-dia do barbeiro: alvo grande, feedback de
       * toque imediato. É o botão mais premido de todo o painel. */}
      <Link
        href="/admin/operacao/scan"
        className="mb-4 flex items-center justify-center gap-3 rounded-2xl bg-brand px-6 py-8 text-[#0e0a07] shadow-lg shadow-brand/20 transition-[opacity,transform,box-shadow] duration-150 ease-out-strong hover:opacity-95 active:scale-[0.97]"
      >
        <ScanLine className="h-7 w-7" />
        <span className="font-heading text-lg font-semibold">Escanear QR do cliente</span>
      </Link>

      <CouponCheck />

      <ClientSearch q={q ?? ""} />

      {term.length >= 2 && results.length === 0 && (
        <p className="rounded-2xl border border-border bg-bg-surface p-6 text-center text-sm text-muted-foreground">
          Nenhum cliente encontrado para “{term}”.
        </p>
      )}

      {term.length === 1 && (
        <p className="px-1 text-[12.5px] text-muted-foreground">
          Escreva pelo menos duas letras.
        </p>
      )}

      {results.length > 0 && (
        <>
          <p className="mb-2 px-1 text-[12.5px] text-muted-foreground" aria-live="polite">
            {results.length} cliente{results.length !== 1 ? "s" : ""} encontrado
            {results.length !== 1 ? "s" : ""}
          </p>
          <ul className="stagger overflow-hidden rounded-2xl border border-border bg-bg-surface">
            {results.map((c, i) => (
              <li key={c.id} {...staggerIndex(i)}>
                <Link
                  href={`/admin/operacao/cliente/${c.qr_token}`}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 transition-[background-color,transform] duration-150 ease-out-strong hover-fine:hover:bg-background active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60"
                >
                  {/* A foto é o que confirma, num relance, que se está a
                   * abrir o cartão da pessoa que está à frente — há nomes
                   * repetidos, e o telefone nem sempre existe. */}
                  <ClientAvatar
                    name={c.name}
                    url={c.avatar_url ?? null}
                    size="md"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="block truncate font-mono text-[12.5px] text-muted-foreground">
                      {c.phone ?? c.email ?? "sem contacto"}
                    </span>
                  </span>
                  <UserSearch
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
