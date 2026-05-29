"use client";

import { useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Deteção de plataforma Capacitor.
 *
 * Em web normal (browser/Vercel) `isNativePlatform()` devolve `false` e todos
 * os caminhos nativos fazem no-op. Dentro da app Capacitor (iOS/Android) a
 * runtime nativa injeta `window.Capacitor` e estes valores ficam corretos.
 */

/** Síncrono — seguro em event handlers / fora de render. */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** "ios" | "android" | "web" */
export function getPlatform(): string {
  return Capacitor.getPlatform();
}

/**
 * Hook hydration-safe via useSyncExternalStore. Server snapshot é sempre
 * `false` (igual ao SSR do Vercel); no cliente resolve para o valor real
 * depois da hidratação, sem mismatch e sem setState dentro de um effect.
 * A "nativeness" é constante, por isso subscribe é um no-op.
 */
const noopSubscribe = () => () => {};

export function useIsNative(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => Capacitor.isNativePlatform(),
    () => false,
  );
}
