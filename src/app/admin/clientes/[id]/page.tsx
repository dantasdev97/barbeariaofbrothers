import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { cardUrl } from "@/lib/loyalty/qr";
import { ClientDetail } from "./client-detail";

export const dynamic = "force-dynamic";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["super_admin", "manager"]);
  const { id } = await params;
  const sb = createAdminClient();

  const [{ data: client }, { data: units }] = await Promise.all([
    sb.from("clients").select("*").eq("id", id).maybeSingle(),
    sb.from("units").select("id, name, slug").order("name"),
  ]);

  if (!client) notFound();

  const [{ data: balances }, { data: transactions }, { data: services }, { data: rewards }] =
    await Promise.all([
      sb.from("client_unit_balances").select("unit_id, balance").eq("client_id", id),
      sb
        .from("loyalty_transactions")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
      sb.from("loyalty_services").select("id, name, unit_id"),
      sb.from("loyalty_rewards").select("id, name, unit_id"),
    ]);

  // Preferir o slug amigável (mais legível em SMS/partilha)
  const url = cardUrl(client.public_slug ?? client.qr_token);

  return (
    <ClientDetail
      client={client}
      units={units ?? []}
      balances={balances ?? []}
      transactions={transactions ?? []}
      services={services ?? []}
      rewards={rewards ?? []}
      cardUrl={url}
    >
      <Link
        href="/admin/clientes"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Voltar à lista
      </Link>
    </ClientDetail>
  );
}
