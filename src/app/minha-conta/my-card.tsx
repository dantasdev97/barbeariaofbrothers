"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Gift, Camera, Loader2, Ticket } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AccountSettings } from "@/components/cliente/account-settings";
import { CardStats } from "@/components/cliente/card-stats";
import { CouponCode } from "@/components/cliente/coupon-code";
import { EarnList } from "@/components/cliente/earn-list";
import { LoyaltyCard, type NextReward } from "@/components/cliente/loyalty-card";
import { LoyaltyHistory } from "@/components/cliente/loyalty-history";
import { formatRewardValue, rewardKindIcon } from "@/lib/loyalty/rewards";
import type { CardStats as CardStatsData, HistoryEntry } from "@/lib/loyalty/history";
import { staggerIndex } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { grantBonus, selfRedeem, setMyDisplayName } from "@/lib/loyalty/client-actions";
import { normalizeInstagramHandle } from "@/lib/loyalty/instagram";
import type { ClientAccount } from "@/lib/loyalty/client-actions";
import type { LoyaltyCouponRow, LoyaltyRewardRow } from "@/types/database.types";

export function MyCard({
  account,
  qrDataUrl,
  history,
  stats,
  memberSince,
}: {
  account: ClientAccount;
  /** Gerado no servidor — é o que o barbeiro lê para abrir este cliente. */
  qrDataUrl?: string;
  /** Movimentos já traduzidos e datados no fuso de Lisboa. */
  history: HistoryEntry[];
  stats: CardStatsData;
  /** "agosto de 2026" */
  memberSince: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toRedeem, setToRedeem] = useState<LoyaltyRewardRow | null>(null);
  /** O cupom acabado de emitir, mostrado em destaque antes de ir para a lista. */
  const [fresh, setFresh] = useState<LoyaltyCouponRow | null>(null);
  /** Conta os resgates desta sessão: faz o brilho passar no cartão, uma vez. */
  const [celebrations, setCelebrations] = useState(0);
  /** @ de Instagram escrito pelo cliente, exigido antes de dar o bónus. */
  const [igHandle, setIgHandle] = useState("");
  /**
   * Como quer ser tratado. Perguntado uma vez, logo depois do cartão nascer:
   * o nome vem do Google ou da parte do email antes do @, e nenhum dos dois é
   * necessariamente como a pessoa se apresenta. Depois disso, muda-se em
   * "A minha conta" — antes o popup era a única oportunidade da vida.
   *
   * Só `false` explícito pergunta: se a coluna ainda não existe na base vem
   * `undefined`, e aí perguntar levaria a um popup que reaparece sempre e cuja
   * gravação falha — a RPC que o grava chega na mesma migração.
   */
  const [askName, setAskName] = useState(account.client.name_confirmed === false);
  const [displayName, setDisplayName] = useState(account.client.name);

  const { client, unit, balance, rewards, services, coupons, claimedBonuses, bonuses } =
    account;

  // Todos os cupões, por usar primeiro. Antes só se mostravam os activos:
  // quem resgatava e usava perdia o registo de vista e ficava sem prova
  // nenhuma de que aquilo existiu.
  const isExpired = (c: LoyaltyCouponRow) =>
    c.status === "expired" ||
    (c.status === "active" && !!c.expires_at && new Date(c.expires_at) < new Date());
  const isUsable = (c: LoyaltyCouponRow) => c.status === "active" && !isExpired(c);
  const sortedCoupons = [...coupons].sort(
    (a, b) => Number(isUsable(b)) - Number(isUsable(a)),
  );

  const upcoming = rewards.find((r) => r.points_cost > balance);
  const nextReward: NextReward | null = upcoming
    ? {
        name: upcoming.name,
        cost: upcoming.points_cost,
        missing: upcoming.points_cost - balance,
        pct: Math.min(100, Math.round((balance / upcoming.points_cost) * 100)),
      }
    : null;

  function confirmRedeem() {
    if (!toRedeem) return;
    const reward = toRedeem;
    setBusyId(reward.id);
    startTransition(async () => {
      const result = await selfRedeem(reward.id, client.unit_id);
      setBusyId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setToRedeem(null);
      setFresh(result.data);
      setCelebrations((n) => n + 1);
      toast.success("Resgatado! Guarde o código.");
      router.refresh();
    });
  }

  function saveName() {
    const name = displayName.trim();
    if (!name) return;
    setBusyId("name");
    startTransition(async () => {
      const result = await setMyDisplayName(name);
      setBusyId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setAskName(false);
      toast.success(`Olá, ${name}!`);
      router.refresh();
    });
  }

  function claimInstagram() {
    const handle = normalizeInstagramHandle(igHandle);
    if (!handle) {
      toast.error("Escreva o seu nome de Instagram.");
      return;
    }
    setBusyId("instagram");
    startTransition(async () => {
      const result = await grantBonus("instagram", client.unit_id, handle);
      setBusyId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`+${bonuses.instagram.points} pontos. Obrigado!`);
      router.refresh();
    });
  }

  return (
    <div className="page-enter mx-auto max-w-xl px-5 py-8">
      <LoyaltyCard
        name={displayName.trim() || client.name}
        unitName={unit?.name ?? null}
        balance={balance}
        qrDataUrl={qrDataUrl ?? null}
        nextReward={nextReward}
        bookingUrl={unit?.buk_url ?? null}
        celebrateKey={celebrations}
      />

      <CardStats stats={stats} memberSince={memberSince} className="mt-5" />

      {/* Cupom acabado de emitir — o momento de recompensa do fluxo.
       * É a única tela que o cliente vê raramente e com expectativa, por
       * isso é onde a animação se justifica. */}
      {fresh && (
        <section className="mt-6 animate-[enter-up_320ms_var(--ease-out-strong)_both] rounded-2xl border-2 border-brand/40 bg-brand/5 p-5">
          <div className="flex items-center gap-2 text-brand">
            <Ticket className="h-5 w-5" />
            <p className="font-heading text-base font-semibold">
              {fresh.reward_label}
            </p>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Mostre ou diga este código ao barbeiro.
          </p>
          <CouponCode code={fresh.code} className="mt-4" />
          {client.email && (
            <p className="mt-3 text-center text-[12px] text-muted-foreground">
              Enviámos também para {client.email}
            </p>
          )}
        </section>
      )}

      {/* Cupons */}
      {sortedCoupons.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-[20px] font-semibold tracking-tight">
            Os meus cupons
          </h2>
          <div className="stagger mt-4 grid gap-3">
            {sortedCoupons.map((c, i) => {
              const usable = isUsable(c);
              const expired = isExpired(c);
              return (
                <div
                  key={c.id}
                  {...staggerIndex(i)}
                  className={`rounded-2xl border p-5 ${
                    usable
                      ? "border-border bg-bg-surface"
                      : "border-border bg-bg-surface opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-heading text-base font-semibold leading-tight">
                      {c.reward_label}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        usable
                          ? "bg-emerald-500/15 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {usable
                        ? "Por usar"
                        : expired
                          ? "Expirado"
                          : `Usado${
                              c.used_at
                                ? ` em ${new Date(c.used_at).toLocaleDateString("pt-PT", {
                                    day: "2-digit",
                                    month: "short",
                                  })}`
                                : ""
                            }`}
                    </span>
                  </div>

                  {usable ? (
                    <>
                      <CouponCode code={c.code} className="mt-3" />
                      {c.expires_at && (
                        <p className="mt-2 text-center text-[11.5px] text-muted-foreground">
                          Válido até{" "}
                          {new Date(c.expires_at).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="mt-2 font-mono text-[13px] text-muted-foreground">
                      {c.code}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recompensas */}
      <section className="mt-10">
        <h2 className="font-heading text-[20px] font-semibold tracking-tight">
          Resgatar pontos
        </h2>
        {rewards.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border bg-bg-surface p-8 text-center text-sm text-muted-foreground">
            Recompensas em preparação.
          </p>
        ) : (
          <div className="stagger mt-4 grid gap-3">
            {rewards.map((r, i) => {
              const enough = balance >= r.points_cost;
              const busy = busyId === r.id;
              const Icon = rewardKindIcon(r.kind);
              const value = formatRewardValue(r.kind, r.value_cents, r.percent);
              return (
                <button
                  key={r.id}
                  {...staggerIndex(i)}
                  disabled={!enough || pending}
                  onClick={() => setToRedeem(r)}
                  className={`flex min-h-16 w-full items-center gap-4 rounded-2xl border p-5 text-left transition-[border-color,background-color,transform,opacity] duration-150 ease-out-strong ${
                    enough
                      ? "border-brand/40 bg-bg-surface hover-fine:hover:border-brand active:scale-[0.99] disabled:opacity-60"
                      : "border-border bg-bg-surface opacity-60"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      enough ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {busy ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-base font-semibold leading-tight">
                      {r.name}
                      {value && (
                        <span className="ml-2 font-sans text-sm font-medium text-brand">
                          {value}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                      {enough
                        ? "Pronto a resgatar"
                        : `Faltam ${r.points_cost - balance} pts`}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-foreground px-3 py-1 font-mono text-[12px] font-bold tabular-nums text-background">
                    {r.points_cost}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Bónus de Instagram. Pede o @ antes de dar os pontos: sem isso era um
       * clique livre e não havia como saber quem seguiu de facto. */}
      {!claimedBonuses.includes("instagram") && bonuses.instagram.active && (
        <section className="mt-6 rounded-2xl border border-dashed border-border bg-bg-surface p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Camera className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-base font-semibold leading-tight">
                Seguir no Instagram
              </p>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                +{bonuses.instagram.points} pontos, uma vez
              </p>
            </div>
          </div>

          <label
            htmlFor="ig-handle"
            className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
          >
            O seu Instagram
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                @
              </span>
              <Input
                id="ig-handle"
                value={igHandle}
                onChange={(e) => setIgHandle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && igHandle.trim() && !pending) claimInstagram();
                }}
                placeholder="oseunome"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="h-12 pl-7 text-base"
              />
            </div>
            <Button
              onClick={claimInstagram}
              disabled={pending || !igHandle.trim()}
              className="h-12 shrink-0 bg-brand px-5 text-primary-foreground hover:bg-brand-hover"
            >
              {busyId === "instagram" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar"
              )}
            </Button>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            Siga-nos e escreva aqui o seu nome de utilizador — confirmamos na
            barbearia.
          </p>
        </section>
      )}

      {/* Como ganhar mais. Sem os bónus: o de registo já foi dado e o do
       * Instagram tem o botão logo acima. */}
      {services.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-[20px] font-semibold tracking-tight">
            Como ganhar pontos
          </h2>
          <EarnList services={services} className="mt-4" />
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            Os pontos de cada serviço entram na sua conta no fim do
            atendimento.
          </p>
        </section>
      )}

      {/* Histórico */}
      <section className="mt-10">
        <h2 className="mb-4 font-heading text-[20px] font-semibold tracking-tight">
          Histórico
        </h2>
        <LoyaltyHistory
          entries={history}
          emptyText="Ainda sem movimentos. O primeiro corte trata disso."
        />
      </section>

      <AccountSettings
        className="mt-10"
        name={client.name}
        phone={client.phone}
        email={client.email}
        onNameChange={setDisplayName}
      />

      <ConfirmDialog
        open={!!toRedeem}
        onOpenChange={(open) => {
          if (!open && !pending) setToRedeem(null);
        }}
        variant="default"
        title="Confirmar resgate"
        description={
          toRedeem
            ? `Resgatar "${toRedeem.name}" por ${toRedeem.points_cost} pontos? Fica com ${balance - toRedeem.points_cost} pontos e recebe um código para usar na barbearia.`
            : ""
        }
        confirmLabel="Resgatar"
        loadingLabel="A resgatar…"
        onConfirm={confirmRedeem}
        loading={pending}
      />

      <p className="mt-12 pb-8 text-center text-[11.5px] leading-relaxed text-muted-foreground">
        <Gift className="mr-1 inline h-3.5 w-3.5" />
        Resgate quando quiser: recebe um código por email e mostra-o na
        barbearia.
      </p>

      {/* Como quer ser tratado. Aparece uma vez, sobre o cartão já criado — o
       * cartão fica à vista por trás e o nome muda enquanto se escreve. */}
      <Dialog open={askName} onOpenChange={(o) => !o && setAskName(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como quer ser tratado?</DialogTitle>
          </DialogHeader>
          <p className="text-[13.5px] leading-relaxed text-muted-foreground">
            É o nome que aparece no seu cartão e que o barbeiro vê ao lançar os
            pontos. Pode mudá-lo depois em &ldquo;A minha conta&rdquo;.
          </p>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && displayName.trim() && !pending) saveName();
            }}
            placeholder="O seu nome"
            autoFocus
            maxLength={60}
            className="mt-1 h-12 text-base"
          />
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDisplayName(client.name);
                setAskName(false);
              }}
              className="flex-1"
            >
              Agora não
            </Button>
            <Button
              onClick={saveName}
              disabled={pending || !displayName.trim()}
              className="flex-1 bg-brand text-primary-foreground hover:bg-brand-hover"
            >
              {busyId === "name" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
