import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin-auth";
import { shortUnitName } from "@/lib/event-labels";
import { cardUrl } from "@/lib/loyalty/qr";
import { ClientDetail, type TxView } from "./client-detail";

export const dynamic = "force-dynamic";

/** A barbearia é em Portugal; o servidor corre em UTC. Ver `admin/page.tsx`. */
const TZ = "Europe/Lisbon";
const shortFmt = new Intl.DateTimeFormat("pt-PT", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const fullFmt = new Intl.DateTimeFormat("pt-PT", {
  timeZone: TZ,
  dateStyle: "long",
  timeStyle: "short",
});
const dateOnlyFmt = new Intl.DateTimeFormat("pt-PT", {
  timeZone: TZ,
  day: "numeric",
  month: "long",
  year: "numeric",
});

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
      sb.from("loyalty_services").select("id, name"),
      sb.from("loyalty_rewards").select("id, name"),
    ]);

  // Preferir o slug amigável (mais legível em SMS/partilha)
  const url = cardUrl(client.public_slug ?? client.qr_token);

  // O cartão do cliente já desenhava o QR; a ficha do admin mostrava só o
  // endereço em texto. Quem está ao balcão precisa é de apontar o telemóvel
  // do cliente ao ecrã — sem isto, tinha de abrir o cartão numa janela nova.
  const qrDataUrl = await QRCode.toDataURL(url, {
    // 2 módulos de margem + o preenchimento branco da caixa dão a zona de
    // silêncio de 4 módulos que a norma pede — é o que garante a leitura
    // quando o telemóvel apanha também o fundo do cartão à volta.
    margin: 2,
    width: 512,
    errorCorrectionLevel: "M",
    color: { dark: "#111827", light: "#ffffff" },
  });

  const unitNameById = new Map(
    (units ?? []).map((u) => [u.id as string, u.name as string]),
  );
  const serviceNameById = new Map(
    (services ?? []).map((s) => [s.id as string, s.name as string]),
  );
  const rewardNameById = new Map(
    (rewards ?? []).map((r) => [r.id as string, r.name as string]),
  );

  const balanceByUnit = new Map(
    (balances ?? []).map((b) => [b.unit_id as string, b.balance ?? 0]),
  );
  const unitBalances = (units ?? []).map((u) => ({
    unitId: u.id as string,
    unitName: u.name as string,
    balance: balanceByUnit.get(u.id as string) ?? 0,
  }));
  const totalPoints = unitBalances.reduce((acc, u) => acc + u.balance, 0);

  // As datas são formatadas aqui, no servidor, e não no componente cliente:
  // com o fuso do browser a marcação dava uma hora diferente da renderizada
  // no servidor e a hidratação acusava a diferença.
  const txs: TxView[] = (transactions ?? []).map((t) => ({
    id: t.id,
    type: t.type,
    points: t.points,
    detail:
      t.type === "earn"
        ? (t.service_id ? serviceNameById.get(t.service_id) : null) ?? "Serviço"
        : t.type === "redeem"
          ? (t.reward_id ? rewardNameById.get(t.reward_id) : null) ??
            "Recompensa"
          : t.note ?? (t.type === "bonus" ? "Bónus" : "Ajuste"),
    unitName: shortUnitName(unitNameById.get(t.unit_id) ?? "—"),
    when: shortFmt.format(new Date(t.created_at)),
    fullDate: fullFmt.format(new Date(t.created_at)),
  }));

  return (
    <div>
      <Link
        href="/admin/clientes"
        className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar à lista
      </Link>

      <ClientDetail
        client={{
          id: client.id,
          name: client.name,
          phone: client.phone,
          email: client.email,
          unitId: client.unit_id,
          unitName: unitNameById.get(client.unit_id) ?? "—",
          instagramHandle: client.instagram_handle ?? null,
          qrToken: client.qr_token,
          avatarUrl: client.avatar_url ?? null,
          authProvider: client.auth_provider ?? null,
          selfRegistered: !!client.auth_user_id,
          createdAt: dateOnlyFmt.format(new Date(client.created_at)),
        }}
        units={units ?? []}
        unitBalances={unitBalances}
        totalPoints={totalPoints}
        transactions={txs}
        cardUrl={url}
        qrDataUrl={qrDataUrl}
      />
    </div>
  );
}
