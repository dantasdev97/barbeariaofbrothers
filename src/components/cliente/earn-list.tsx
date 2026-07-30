import { Camera, Scissors, UserPlus } from "lucide-react";
import { staggerIndex } from "@/lib/motion";
import type { LoyaltyServiceRow } from "@/types/database.types";

export type EarnListBonuses = {
  signup: { points: number; active: boolean };
  instagram: { points: number; active: boolean };
};

/**
 * "Formas de ganhar" — partilhada entre `/programa` (quem ainda não tem
 * conta) e `/minha-conta` (quem acabou de criar).
 *
 * Quem se acabou de registar precisa de ver isto tanto como quem está a
 * decidir se cria conta: um saldo a zero sem explicação não diz o que fazer
 * a seguir.
 */
export function EarnList({
  services,
  bonuses,
  className,
}: {
  services: LoyaltyServiceRow[];
  /**
   * Pontos reais dos bónus de registo/Instagram, configurados por unidade
   * em `/admin/fidelidade/bonus`. `undefined`/`null` esconde as duas
   * linhas — usado no cartão, onde o bónus de registo já foi dado e o do
   * Instagram tem um botão próprio, que atribui os pontos; repeti-lo aqui
   * daria a entender que há dois.
   */
  bonuses?: EarnListBonuses | null;
  className?: string;
}) {
  const showSignup = !!bonuses?.signup.active;
  const showInstagram = !!bonuses?.instagram.active;
  const offset = (showSignup ? 1 : 0) + (showInstagram ? 1 : 0);

  return (
    <div
      className={`stagger overflow-hidden rounded-2xl border border-border bg-bg-surface ${className ?? ""}`}
    >
      {showSignup && (
        <EarnRow
          index={0}
          icon={<UserPlus className="h-5 w-5" />}
          title="Criar conta"
          detail={`${bonuses!.signup.points} pontos de boas-vindas`}
        />
      )}
      {showInstagram && (
        <EarnRow
          index={showSignup ? 1 : 0}
          icon={<Camera className="h-5 w-5" />}
          title="Seguir no Instagram"
          detail={`${bonuses!.instagram.points} pontos`}
        />
      )}
      {services.map((s, i) => (
        <EarnRow
          key={s.id}
          index={i + offset}
          icon={<Scissors className="h-5 w-5" />}
          title={s.name}
          detail={`${s.points_value} pontos`}
        />
      ))}
    </div>
  );
}

function EarnRow({
  index,
  icon,
  title,
  detail,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div
      {...staggerIndex(index)}
      className={`flex items-center gap-4 px-5 py-4 ${
        index > 0 ? "border-t border-border" : ""
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-medium leading-tight">{title}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
