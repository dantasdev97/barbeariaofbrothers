import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor embrulha o site live numa WebView (server.url → produção).
 * Server Actions, RSC, cookies de sessão e RLS continuam a funcionar
 * porque a WebView navega para o origin real. As camadas nativas
 * (push, scanner, tab bar, safe-area) ativam quando isNativePlatform() é true.
 *
 * webDir aponta para mobile-fallback/ (ecrã de arranque/offline); NÃO é o app real.
 */
const config: CapacitorConfig = {
  appId: "pt.barbeariaofbrothers.admin",
  appName: "Of Brothers Admin",
  webDir: "mobile-fallback",
  server: {
    url: "https://barbeariaofbrothers.pt",
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#0a0a0a",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
