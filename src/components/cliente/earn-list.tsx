import { Camera, Scissors, UserPlus } from "lucide-react";
import { staggerIndex } from "@/lib/motion";
import type { LoyaltyServiceRow } from "@/types/database.types";

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
  showBonuses = true,
  className,
}: {
  services: LoyaltyServiceRow[];
  /**
   * Os bónus de registo e Instagram só interessam a quem ainda não os tem.
   * No cartão são desligados: lá o Instagram já tem um botão próprio, que
   * atribui os pontos, e repeti-lo aqui daria a entender que há dois.
   */
  showBonuses?: boolean;
  className?: string;
}) {
  const offset = showBonuses ? 2 : 0;

  return (
    <div
      className={`stagger overflow-hidden rounded-2xl border border-border bg-bg-surface ${className ?? ""}`}
    >
      {showBonuses && (
        <>
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
        </>
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
