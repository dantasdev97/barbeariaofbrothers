"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { COUNT_SPRING } from "@/lib/motion";

/**
 * Número que conta até ao valor final.
 *
 * Aqui o JS justifica-se: o valor é dinâmico e vem do servidor, não dá para
 * exprimir em keyframes. Quem usa isto tem de aplicar `tabular-nums` — sem
 * isso os dígitos têm larguras diferentes e o número treme enquanto conta.
 *
 * A marcação é sempre a mesma, com ou sem movimento reduzido. Ramificar o
 * JSX em `useReducedMotion()` parte a hidratação: o servidor não conhece a
 * preferência do utilizador e renderia uma árvore diferente da do cliente.
 * Com movimento reduzido saltamos direitos ao valor, sem contar.
 */
export function AnimatedNumber({ value }: { value: number }) {
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
