import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { getAllUnits, getUnitBySlug } from "@/lib/data";
import { GoogleSignInButton } from "@/components/cliente/google-signin-button";
import { EarnList } from "@/components/cliente/earn-list";
import type { EarnListBonuses } from "@/components/cliente/earn-list";
import { RewardsList } from "@/components/cliente/rewards-list";
import type { LoyaltyBonusKind, LoyaltyRewardRow, LoyaltyServiceRow } from "@/types/database.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Programa de Pontos · Barbearia Of Brothers",
  description:
    "Ganhe pontos em cada corte e troque por cortes, descontos e brindes da Barbearia Of Brothers.",
};

/**
 * Página de entrada do programa de fidelidade.
 *
 * Fica aberta a quem ainda não tem conta de propósito: mostrar primeiro o
 * que se ganha e só depois pedir o registo é o que faz a pessoa criar conta.
 * Pedir a conta antes de explicar o valor perde quase toda a gente.
 */
export default async function ProgramaPage({
  searchParams,
}: {
  searchParams: Promise<{ unidade?: string }>;
}) {
  const { unidade } = await searchParams;
  const sb = createPublicClient();

  // O botão fixo da landing é por unidade e passa o slug: quem vem do
  // Vale de Lobos tem de ver os serviços e recompensas do Vale de Lobos.
  // Antes mostrava sempre a primeira unidade a toda a gente.
  const units = await getAllUnits();
  const unit = (unidade ? await getUnitBySlug(unidade) : null) ?? units[0] ?? null;

  let services: LoyaltyServiceRow[] = [];
  let rewards: LoyaltyRewardRow[] = [];
  let bonuses: EarnListBonuses | null = null;

  if (sb && unit) {
    const [s, r, b] = await Promise.all([
      sb
        .from("loyalty_services")
        .select("*")
        .eq("unit_id", unit.id)
        .eq("active", true)
        .order("display_order"),
      sb
        .from("loyalty_rewards")
        .select("*")
        .eq("unit_id", unit.id)
        .eq("active", true)
        .order("points_cost"),
      sb.from("loyalty_bonuses").select("kind, points, active").eq("unit_id", unit.id),
    ]);
    services = (s.data ?? []) as LoyaltyServiceRow[];
    rewards = (r.data ?? []) as LoyaltyRewardRow[];

    // RLS só devolve linhas activas: sem linha é desactivado, nunca 50/30
    // por omissão — quem decide o valor é o painel, não esta página.
    const bonusList = (b.data ?? []) as { kind: LoyaltyBonusKind; points: number; active: boolean }[];
    const findBonus = (kind: LoyaltyBonusKind) => bonusList.find((x) => x.kind === kind);
    bonuses = {
      signup: { points: findBonus("signup")?.points ?? 50, active: findBonus("signup")?.active ?? false },
      instagram: {
        points: findBonus("instagram")?.points ?? 30,
        active: findBonus("instagram")?.active ?? false,
      },
    };
  }

  // Quem já entrou não precisa de ver o convite outra vez.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-[100dvh] bg-background">
      {/* Hero */}
      <section className="bg-foreground px-6 pb-16 pt-14 text-background">
        <div className="mx-auto max-w-xl page-enter">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
            <Sparkles className="h-3 w-3" />
            Cartão Fidelidade
          </p>
          <h1 className="mt-4 font-heading text-[34px] font-semibold leading-[1.08] tracking-tight sm:text-[42px]">
            Cada corte conta pontos
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-background/70">
            Junte pontos em cada visita e troque por cortes, descontos e
            brindes da casa. Sem cartão de papel para perder.
          </p>

          <div className="mt-8">
            {user ? (
              <Link
                href="/minha-conta"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-6 text-[15px] font-semibold text-[#0e0a07] transition-[opacity,transform] duration-150 ease-out-strong hover-fine:hover:opacity-90 active:scale-[0.98]"
              >
                Ver o meu cartão
              </Link>
            ) : (
              <>
                <GoogleSignInButton
                  next="/minha-conta"
                  label="Criar conta grátis"
                  className="border-transparent bg-brand text-[#0e0a07] hover-fine:hover:opacity-90"
                />
                <p className="mt-3 text-center text-[13px] text-background/60">
                  Já tem conta?{" "}
                  <Link href="/entrar" className="font-semibold text-brand underline underline-offset-2">
                    Iniciar sessão
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-xl space-y-12 px-6 py-12">
        {/* Formas de ganhar */}
        <section>
          <h2 className="font-heading text-[22px] font-semibold tracking-tight">
            Formas de ganhar
          </h2>
          <EarnList services={services} bonuses={bonuses} className="mt-5" />
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            Os pontos dos serviços entram quando o barbeiro escaneia o QR do
            seu cartão, no fim do atendimento.
          </p>
        </section>

        {/* Formas de resgatar */}
        <section>
          <h2 className="font-heading text-[22px] font-semibold tracking-tight">
            Formas de resgatar
          </h2>
          <RewardsList rewards={rewards} className="mt-5" />
        </section>

        {/* Fecho para quem ainda não entrou. A LB faz o mesmo no fim da
         * lista: a pessoa acabou de ver o que ganha, é ali que decide. */}
        {!user && (
          <section className="rounded-2xl bg-foreground p-7 text-center text-background">
            <h2 className="font-heading text-[22px] font-semibold leading-tight tracking-tight">
              Comece a ganhar hoje
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-background/70">
              Criar conta é grátis e leva um toque. Os pontos começam a contar
              no próximo corte.
            </p>
            <div className="mt-6">
              <GoogleSignInButton
                next="/minha-conta"
                label="Criar conta grátis"
                className="border-transparent bg-brand text-[#0e0a07] hover-fine:hover:opacity-90"
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

