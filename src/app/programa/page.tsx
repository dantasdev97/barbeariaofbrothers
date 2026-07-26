import Link from "next/link";
import type { Metadata } from "next";
import { Gift, Camera, Scissors, Sparkles, UserPlus } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { getAllUnits } from "@/lib/data";
import { GoogleSignInButton } from "@/components/cliente/google-signin-button";
import { formatRewardValue, rewardKindIcon } from "@/lib/loyalty/rewards";
import { staggerIndex } from "@/lib/motion";
import type { LoyaltyRewardRow, LoyaltyServiceRow } from "@/types/database.types";

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
export default async function ProgramaPage() {
  const sb = createPublicClient();
  const units = await getAllUnits();
  const unit = units[0] ?? null;

  let services: LoyaltyServiceRow[] = [];
  let rewards: LoyaltyRewardRow[] = [];

  if (sb && unit) {
    const [s, r] = await Promise.all([
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
    ]);
    services = (s.data ?? []) as LoyaltyServiceRow[];
    rewards = (r.data ?? []) as LoyaltyRewardRow[];
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
          <div className="stagger mt-5 overflow-hidden rounded-2xl border border-border bg-bg-surface">
            <EarnRow
              index={0}
              icon={<UserPlus className="h-5 w-5" />}
              title="Criar conta"
              detail="50 pontos de boas-vindas"
            />
            <EarnRow
              index={1}
              icon={<Camera className="h-5 w-5" />}
              title="Seguir no Instagram"
              detail="30 pontos"
            />
            {services.map((s, i) => (
              <EarnRow
                key={s.id}
                index={i + 2}
                icon={<Scissors className="h-5 w-5" />}
                title={s.name}
                detail={`${s.points_value} pontos`}
              />
            ))}
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            Os pontos dos serviços entram quando o barbeiro escaneia o seu
            cartão no fim do atendimento.
          </p>
        </section>

        {/* Formas de resgatar */}
        <section>
          <h2 className="font-heading text-[22px] font-semibold tracking-tight">
            Formas de resgatar
          </h2>
          {rewards.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-border bg-bg-surface p-8 text-center text-sm text-muted-foreground">
              Recompensas em preparação.
            </p>
          ) : (
            <div className="stagger mt-5 grid gap-3">
              {rewards.map((r, i) => {
                const Icon = rewardKindIcon(r.kind);
                const value = formatRewardValue(r.kind, r.value_cents, r.percent);
                return (
                  <div
                    key={r.id}
                    {...staggerIndex(i)}
                    className="flex items-start gap-4 rounded-2xl border border-border bg-bg-surface p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-base font-semibold leading-tight">
                        {r.name}
                        {value && (
                          <span className="ml-2 font-sans text-sm font-medium text-brand">
                            {value}
                          </span>
                        )}
                      </h3>
                      {r.description && (
                        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                          {r.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-foreground px-3 py-1 font-mono text-[12px] font-bold tabular-nums text-background">
                      {r.points_cost}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {!user && (
          <section className="rounded-2xl bg-bg-surface p-6 text-center">
            <Gift className="mx-auto h-7 w-7 text-brand" />
            <p className="mt-3 font-heading text-lg font-semibold leading-tight">
              Comece a ganhar hoje
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Criar conta é grátis e leva um toque.
            </p>
            <div className="mt-5">
              <GoogleSignInButton next="/minha-conta" label="Criar conta grátis" />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function EarnRow({
  icon,
  title,
  detail,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  index: number;
}) {
  return (
    <div
      {...staggerIndex(index)}
      className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">{title}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
