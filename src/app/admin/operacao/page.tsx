import Link from "next/link";
import { Search, ScanLine } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string };

export default async function OperacaoLanding({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { profile } = await requireRole(["super_admin", "manager", "barbeiro"]);
  const { q } = await searchParams;
  const sb = createAdminClient();

  let results: Array<{ id: string; name: string; phone: string; qr_token: string }> = [];
  if (q && q.trim().length >= 2) {
    const { data } = await sb
      .from("clients")
      .select("id, name, phone, qr_token, unit_id")
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(20);
    results = data ?? [];
  }

  return (
    <div className="mx-auto max-w-md">
      <header className="mb-7 border-b border-border pb-6">
        <h1 className="font-heading text-[28px] font-semibold leading-none tracking-tight">
          Operação
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {profile.role === "barbeiro" ? "Lança serviços e resgates dos clientes." : "Painel operacional."}
        </p>
      </header>

      <Link
        href="/admin/operacao/scan"
        className="mb-4 flex items-center justify-center gap-3 rounded-2xl bg-brand px-6 py-8 text-[#0e0a07] transition hover:opacity-90"
      >
        <ScanLine className="h-7 w-7" />
        <span className="font-heading text-lg font-semibold">Escanear QR do cliente</span>
      </Link>

      <form
        action="/admin/operacao"
        method="get"
        className="mb-3"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nome ou telefone…"
            className="h-12 pl-9 text-base"
            autoFocus={!q}
          />
        </div>
      </form>

      {q && results.length === 0 && (
        <p className="rounded-2xl border border-border bg-bg-surface p-6 text-center text-sm text-muted-foreground">
          Nenhum cliente encontrado.
        </p>
      )}

      {results.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-bg-surface">
          {results.map((c) => (
            <Link
              key={c.id}
              href={`/admin/operacao/cliente/${c.qr_token}`}
              className="block border-b border-border px-5 py-4 transition hover:bg-background"
            >
              <div className="font-medium">{c.name}</div>
              <div className="font-mono text-[12.5px] text-muted-foreground">
                {c.phone}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
