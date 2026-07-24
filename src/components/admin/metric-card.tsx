"use client";

import { useEffect, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { COUNT_SPRING } from "@/lib/motion";

export type MetricTone = "brand" | "green" | "blue" | "mute";

/**
 * Paleta por tom. As cores do traço são literais e não os tokens
 * `--chart-*`: no tema deste projeto essa rampa é toda laranja, por isso um
 * cartão "verde" saía com ícone verde e gráfico laranja. Cada tom tem de ler
 * como uma cor só.
 */
const TONE: Record<MetricTone, { badge: string; line: string; icon: string }> = {
  brand: {
    badge: "bg-brand/15 text-brand",
    line: "#F39200",
    icon: "bg-brand/10 text-brand",
  },
  green: {
    badge: "bg-emerald-500/15 text-emerald-600",
    line: "#10b981",
    icon: "bg-emerald-500/10 text-emerald-600",
  },
  blue: {
    badge: "bg-blue-500/15 text-blue-600",
    line: "#3b82f6",
    icon: "bg-blue-500/10 text-blue-600",
  },
  mute: {
    badge: "bg-muted text-muted-foreground",
    line: "#94a3b8",
    icon: "bg-muted text-muted-foreground",
  },
};

/**
 * Número que conta até ao valor final.
 *
 * Aqui o JS justifica-se: o valor é dinâmico e vem do servidor, não dá para
 * exprimir em keyframes. `tabular-nums` é obrigatório — sem isso os dígitos
 * têm larguras diferentes e o número treme enquanto conta.
 *
 * A marcação é sempre a mesma, com ou sem movimento reduzido. Ramificar o
 * JSX em `useReducedMotion()` rebenta a hidratação: o servidor não conhece a
 * preferência do utilizador e renderia uma árvore diferente da do cliente.
 * Com movimento reduzido saltamos direitos ao valor, sem contar.
 */
function AnimatedNumber({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const source = useMotionValue(0);
  const spring = useSpring(source, COUNT_SPRING);
  const text = useTransform(spring, (v) =>
    Math.round(v).toLocaleString("pt-PT"),
  );

  useEffect(() => {
    source.set(value);
    if (reduced) spring.jump(value);
  }, [reduced, source, spring, value]);

  return <motion.span>{text}</motion.span>;
}

/**
 * Constrói os paths do sparkline num viewBox 100×32.
 *
 * SVG à mão em vez de uma biblioteca de gráficos: para 30 pontos sem eixos,
 * sem tooltip e sem interacção, uma polyline chega. Evita ~100kb de JS no
 * cliente e o aviso de SSR do recharts (que mede largura 0 no servidor e
 * só desenha depois de hidratar).
 */
function buildSparkline(series?: number[]) {
  if (!series || series.length < 2) return null;

  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min || 1;
  const stepX = 100 / (series.length - 1);
  // 1px de margem em cima e em baixo para o traço não ser cortado.
  const points = series.map((v, i) => {
    const x = i * stepX;
    const y = 31 - ((v - min) / span) * 30;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return {
    line: `M${points.join("L")}`,
    area: `M0,32L${points.join("L")}L100,32Z`,
  };
}

export function MetricCard({
  label,
  value,
  hint,
  tone = "brand",
  series,
  icon,
  className,
}: {
  label: string;
  value: number;
  /** Texto curto ao lado do valor (ex. "este mês"). */
  hint?: string;
  tone?: MetricTone;
  /**
   * Série real para o sparkline — um ponto por dia. Omitir quando a métrica
   * não tem história; é preferível não mostrar gráfico nenhum a desenhar um
   * padrão inventado que o utilizador vai ler como informação.
   */
  series?: number[];
  /**
   * Ícone **já renderizado** (`<Gift className="h-4 w-4" />`), não o
   * componente. Este cartão é client component e quem o usa são páginas
   * server — passar o componente atravessaria a fronteira como função e
   * rebenta na serialização; um elemento React passa sem problema.
   */
  icon?: ReactNode;
  className?: string;
}) {
  const t = TONE[tone];
  const spark = buildSparkline(series);
  const gradientId = `spark-${tone}-${label.replace(/\W/g, "")}`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-bg-surface p-5",
        "transition-[border-color,box-shadow] duration-200 ease-out-strong",
        "hover-fine:hover:border-brand/30 hover-fine:hover:shadow-premium",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        {icon && <div className={cn("rounded-lg p-1.5", t.icon)}>{icon}</div>}
      </div>

      <div className="my-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <div className="font-heading text-[32px] font-semibold leading-none tracking-tight tabular-nums">
          <AnimatedNumber value={value} />
        </div>
        {hint && (
          <div
            className={cn(
              "rounded-full px-2 py-0.5 text-[12px] font-semibold",
              t.badge,
            )}
          >
            {hint}
          </div>
        )}
      </div>

      <div className="h-8">
        {spark && (
          <svg
            viewBox="0 0 100 32"
            preserveAspectRatio="none"
            className="h-full w-full"
            aria-hidden
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.line} stopOpacity={0.35} />
                <stop offset="100%" stopColor={t.line} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={spark.area} fill={`url(#${gradientId})`} />
            <path
              d={spark.line}
              fill="none"
              stroke={t.line}
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
