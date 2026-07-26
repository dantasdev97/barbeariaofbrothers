import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllUnits } from "@/lib/data";
import { getMyAccount } from "@/lib/loyalty/client-actions";
import { MyCard } from "./my-card";
import { StartCard } from "./start-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "O meu cartão",
  robots: { index: false, follow: false },
};

export default async function MinhaContaPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) redirect("/entrar?next=/minha-conta");

  const account = await getMyAccount();

  // Autenticado mas ainda sem cartão. É o estado de quem acabou de criar
  // conta — escolhe a unidade e o cartão nasce, sem validação nenhuma.
  if (!account) {
    const units = await getAllUnits();
    return (
      <StartCard
        units={units.map((u) => ({ id: u.id, name: u.name }))}
        defaultName={
          (user.user_metadata?.full_name as string | undefined) ??
          user.email?.split("@")[0] ??
          ""
        }
      />
    );
  }

  return <MyCard account={account} />;
}
