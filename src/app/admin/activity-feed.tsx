import {
  ArrowUpRight,
  Eye,
  Gift,
  MessageCircle,
  Package,
  Scissors,
  ShoppingCart,
} from "lucide-react";
import { eventMeta, TONE_CHIP } from "@/lib/event-labels";
import { staggerIndex } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Uma linha do registo de actividade, já traduzida para linguagem humana
 * pela página. O componente não sabe nada de eventos nem de Supabase: recebe
 * o que há para mostrar.
 */
export type ActivityItem = {
  id: string;
  type: string;
  /** O que aconteceu, em concreto: nome do produto, do barbeiro, da página. */
  title: string;
  /** Caminho da página no site público, quando o evento o registou. */
  path: string | null;
  /** Foto do produto ou do barbeiro. */
  imageUrl: string | null;
  fallback: "page" | "product" | "barber" | "cart" | "chat" | "gift";
  unitName: string | null;
  /** "14:32", já no fuso de Lisboa. */
  time: string;
  /** "hoje", "ontem" ou "6 set". */
  dayLabel: string;
  /** Data e hora por extenso, para o `title` do elemento. */
  fullDate: string;
};

const FALLBACK_ICON = {
  page: Eye,
  product: Package,
  barber: Scissors,
  cart: ShoppingCart,
  chat: MessageCircle,
  gift: Gift,
} as const;

/**
 * Miniatura da linha.
 *
 * Um produto sem foto e uma visita a uma página não podem ficar com um
 * buraco de 40px: cada tipo tem um ícone de recurso, sempre no mesmo sítio,
 * para o olho poder varrer a coluna e reconhecer o tipo antes de ler.
 */
function Thumb({ item }: { item: ActivityItem }) {
  if (item.imageUrl) {
    // `<img>` e não `next/image`: um endereço fora dos `remotePatterns` faz o
    // componente do Next atirar durante a renderização — uma foto antiga de
    // um produto deitaria o dashboard inteiro abaixo. Numa miniatura de 40px
    // não há nada a optimizar.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.imageUrl}
        alt=""
        loading="lazy"
        className="h-10 w-10 shrink-0 rounded-lg bg-background object-cover"
      />
    );
  }
  const Icon = FALLBACK_ICON[item.fallback];
  return (
    <div
      aria-hidden
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground"
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

function TypeChip({ type }: { type: string }) {
  const meta = eventMeta(type);
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]",
        TONE_CHIP[meta.tone],
      )}
    >
      {meta.label}
    </span>
  );
}

function Row({ item, index }: { item: ActivityItem; index: number }) {
  const inner = (
    <>
      <Thumb item={item} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13.5px] font-medium leading-tight">
            {item.title}
          </span>
          <TypeChip type={item.type} />
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] leading-tight text-muted-foreground">
          {item.path ? (
            <>
              <span className="truncate font-mono">{item.path}</span>
              <ArrowUpRight aria-hidden className="h-3 w-3 shrink-0 opacity-60" />
            </>
          ) : (
            <span className="truncate">{item.unitName ?? "—"}</span>
          )}
        </div>
      </div>

      {/* Unidade só a partir de sm: no telemóvel competia com a hora e
       * empurrava o nome do produto para duas letras. */}
      {item.unitName && item.path && (
        <span className="hidden shrink-0 rounded-full bg-background px-2 py-0.5 text-[11px] text-muted-foreground sm:inline">
          {item.unitName}
        </span>
      )}

      <div className="shrink-0 text-right" title={item.fullDate}>
        <div className="font-mono text-[12px] tabular-nums leading-tight">
          {item.time}
        </div>
        <div className="text-[11px] leading-tight text-muted-foreground">
          {item.dayLabel}
        </div>
      </div>
    </>
  );

  const shared =
    "flex items-center gap-3 border-t border-border px-4 py-2.5 transition-colors duration-150 sm:px-5";

  // Com caminho, a linha abre a página que a pessoa viu — é a pergunta
  // seguinte de quem lê o registo ("que página é essa?"). Sem caminho não há
  // para onde ir e a linha fica texto, em vez de um link que não leva a lado
  // nenhum.
  if (item.path) {
    return (
      <li {...staggerIndex(index)}>
        <a
          href={item.path}
          target="_blank"
          rel="noopener"
          aria-label={`${eventMeta(item.type).label}: ${item.title} — abrir ${item.path} numa nova janela`}
          className={cn(
            shared,
            "hover-fine:hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 active:bg-background",
          )}
        >
          {inner}
        </a>
      </li>
    );
  }

  return (
    <li {...staggerIndex(index)} className={shared}>
      {inner}
    </li>
  );
}

export function ActivityFeed({
  items,
  subtitle,
  className,
}: {
  items: ActivityItem[];
  /** Segue o filtro de datas — "· 7 dias", "· 9 ago – 7 set". */
  subtitle: string;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="atividade-recente"
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-bg-surface",
        className,
      )}
    >
      <div className="px-5 py-4 sm:px-6 sm:py-[18px]">
        <h2
          id="atividade-recente"
          className="font-heading text-base font-semibold tracking-tight"
        >
          Atividade recente
        </h2>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          {subtitle}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border-t border-border px-6 py-12 text-center">
          <Eye aria-hidden className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sem visitas neste período.
          </p>
        </div>
      ) : (
        <ul className="stagger">
          {items.map((item, i) => (
            <Row key={item.id} item={item} index={i} />
          ))}
        </ul>
      )}
    </section>
  );
}
