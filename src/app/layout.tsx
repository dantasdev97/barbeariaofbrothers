import type { Metadata, Viewport } from "next";
import { Poppins, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/public/cookie-banner";
import { NativeProvider } from "@/components/native/native-provider";
import { LocaleProvider } from "@/components/public/locale-provider";
import { getServerI18n } from "@/lib/i18n/server";
import { absoluteUrl, siteUrl } from "@/lib/utils";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  // Tem de usar a mesma origem que o `absoluteUrl()`: um metadataBase que
  // discorde manda todos os URLs relativos de OG para o host errado.
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Barbearia em Leiria | Of Brothers — Desde 2012",
    template: "%s · Barbearia Of Brothers",
  },
  description:
    "Barbearia Of Brothers — corte, barba e estilo desde 2012. Agende online com os nossos barbeiros e descubra os nossos produtos.",
  applicationName: "Barbearia Of Brothers",
  authors: [{ name: "Barbearia Of Brothers" }],
  // Sem `alternates` aqui de propósito. No App Router o canonical do root é
  // herdado por todas as rotas que não o sobrescrevam, e era isso que fazia as
  // páginas legais, o admin, o login e todos os 404 declararem-se como sendo a
  // homepage. Cada página define o seu via `buildPageMetadata`/`buildUnitMetadata`.
  // Fonte única dos ícones. Havia também um `src/app/favicon.ico` — convenção
  // de ficheiro do Next — que injetava um `<link rel="icon" sizes="16x16">`
  // extra, com uma query diferente da destas. O browser via dois URLs para o
  // mesmo ficheiro e ficava com a variante de 16px, borratada no separador.
  // O `public/favicon.ico` (byte a byte igual) continua a servir /favicon.ico.
  icons: {
    icon: [
      { url: "/favicon.ico?v=4", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/favicon-32x32.png?v=4", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192x192.png?v=4", sizes: "192x192", type: "image/png" },
    ],
    apple: "/favicon-192x192.png?v=4",
  },
  openGraph: {
    type: "website",
    locale: "pt_PT",
    siteName: "Barbearia Of Brothers",
    url: absoluteUrl("/"),
    // A imagem vem de `src/app/opengraph-image.tsx` (convenção de ficheiro do
    // Next, que tem prioridade sobre este objeto). O antigo `/og-image.png`
    // estava declarado aqui mas devolvia 404.
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  verification: {
    google: "TZ183FG2FT2d-HkatPtDFd5H088zq4ARLVsJJIeSeTU",
  },
};

export const viewport: Viewport = {
  themeColor: "#F39200",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, dict } = await getServerI18n();

  return (
    <html
      lang={locale}
      className={`${poppins.variable} ${spaceGrotesk.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <LocaleProvider locale={locale} dict={dict}>
          {children}
          <CookieBanner />
        </LocaleProvider>
        <NativeProvider />
        <Toaster
          theme="light"
          position="bottom-right"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
