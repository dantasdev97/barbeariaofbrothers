"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";
import { savePushToken } from "@/lib/native/push-actions";

/**
 * Inicializa as integrações nativas Capacitor. Montado no root layout mas
 * só faz alguma coisa dentro da app nativa (isNativePlatform). Em web é no-op.
 *
 * - Esconde o splash screen assim que o webview carrega
 * - Configura status bar e keyboard
 * - Trata o botão "voltar" do Android
 * - Regista push notifications quando há sessão ativa e grava o token no perfil
 * - Marca <html class="capacitor-native"> para CSS de safe-area
 */
export function NativeProvider() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.documentElement.classList.add("capacitor-native");

    let cleanup: Array<() => void> = [];

    (async () => {
      // --- UI nativa ---
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide();
      } catch {
        /* plugin ausente */
      }

      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        // App é tema claro → texto escuro na status bar
        await StatusBar.setStyle({ style: Style.Light });
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setBackgroundColor({ color: "#ffffff" });
        }
      } catch {
        /* plugin ausente */
      }

      try {
        const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
        await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
      } catch {
        /* plugin ausente */
      }

      // --- Botão voltar (Android) ---
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) window.history.back();
          else App.exitApp();
        });
        cleanup.push(() => handle.remove());
      } catch {
        /* plugin ausente */
      }

      // --- Push notifications ---
      cleanup = cleanup.concat(await registerPush());
    })();

    return () => {
      cleanup.forEach((fn) => fn());
    };
  }, []);

  return null;
}

/** Regista push notifications se houver sessão; devolve cleanups dos listeners. */
async function registerPush(): Promise<Array<() => void>> {
  const cleanups: Array<() => void> = [];
  try {
    // Só faz sentido com utilizador autenticado (admin/barbeiro).
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return cleanups;

    const { PushNotifications } = await import("@capacitor/push-notifications");

    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return cleanups;

    const platform = Capacitor.getPlatform();

    const reg = await PushNotifications.addListener("registration", (token) => {
      void savePushToken(token.value, platform);
    });
    cleanups.push(() => reg.remove());

    const errReg = await PushNotifications.addListener(
      "registrationError",
      (err) => {
        console.error("[push] registrationError", err);
      },
    );
    cleanups.push(() => errReg.remove());

    const tapReg = await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        const url = action.notification.data?.url as string | undefined;
        if (url && url.startsWith("/")) window.location.href = url;
      },
    );
    cleanups.push(() => tapReg.remove());

    await PushNotifications.register();
  } catch (err) {
    console.error("[push] setup falhou", err);
  }
  return cleanups;
}
