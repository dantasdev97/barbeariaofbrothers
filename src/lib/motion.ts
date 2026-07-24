/**
 * Vocabulário de movimento do admin.
 *
 * Regra de ouro: **animação previsível vai em CSS**, não em JS. O CSS corre
 * fora da main thread, por isso continua fluido enquanto o browser carrega
 * uma página nova — que é exatamente quando a navegação anima. O Framer
 * Motion usa requestAnimationFrame e perde frames nesse momento.
 *
 * Ficam para JS só os casos genuinamente dinâmicos: valores que contam até
 * um número, gestos interrompíveis, física.
 *
 * Os tokens de easing/keyframes vivem em `src/app/globals.css` (`@theme`),
 * e geram os utilitários `ease-out-strong`, `ease-drawer`, `.stagger`,
 * `.page-enter`. Este ficheiro só espelha os valores para uso em JS.
 */

/** Curva de saída forte. Para tudo que entra ou responde ao utilizador. */
export const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const;

/** Curva de gaveta (Ionic/iOS). Para painéis que deslizam. */
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

/**
 * Durações em ms. Animação de UI fica abaixo de 300ms — quanto mais vezes
 * por dia o utilizador vê, mais curta tem de ser.
 */
export const DURATION = {
  /** Feedback de toque em botões. */
  press: 150,
  /** Tooltips e popovers pequenos. */
  pop: 180,
  /** Indicador da tab bar a deslizar entre destinos. */
  tab: 260,
  /** Gaveta lateral a abrir. Fechar deve ser mais rápido. */
  drawer: 300,
  drawerExit: 220,
} as const;

/**
 * Spring para contagem de números no dashboard. Sem bounce: é um painel
 * profissional, não um componente lúdico.
 */
export const COUNT_SPRING = {
  stiffness: 90,
  damping: 26,
  mass: 1,
} as const;

/** Atraso entre itens numa cascata. Curto de propósito. */
export const STAGGER_STEP = 0.034;

/**
 * Props de índice para a cascata em CSS. Usar no filho directo de `.stagger`:
 * `<div {...staggerIndex(i)}>`. Teto no 12º item — numa lista longa, atrasos
 * acumulados fazem os últimos itens aparecerem tarde demais.
 */
export function staggerIndex(index: number): { style: React.CSSProperties } {
  return {
    style: { "--stagger-index": Math.min(index, 12) } as React.CSSProperties,
  };
}
