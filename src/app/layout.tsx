import type { Metadata, Viewport } from "next";
import { Poppins, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/public/cookie-banner";
import { NativeProvider } from "@/components/native/native-provider";
import { LocaleProvider } from "@/components/public/locale-provider";
import { getServerI18n } from "@/lib/i18n/server";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://barbeariaofbrothers.pt",
  ),
  title: {
    default: "Barbearia em Leiria | Of Brothers — Desde 2012",
    template: "%s · Barbearia Of Brothers",
  },
  description:
    "Barbearia Of Brothers — corte, barba e estilo desde 2012. Agende online com os nossos barbeiros e descubra os nossos produtos.",
  applicationName: "Barbearia Of Brothers",
  authors: [{ name: "Barbearia Of Brothers" }],
  alternates: { canonical: "https://barbeariaofbrothers.pt" },
  icons: {
    icon: [
      { rel: "icon", url: "/favicon.ico?v=2" },
      { rel: "icon", url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
      { rel: "icon", url: "/favicon-192x192.png?v=2", sizes: "192x192", type: "image/png" },
    ],
    apple: "/favicon-192x192.png?v=2",
  },
  openGraph: {
    type: "website",
    locale: "pt_PT",
    siteName: "Barbearia Of Brothers",
    url: "https://barbeariaofbrothers.pt",
    images: [{ url: "https://barbeariaofbrothers.pt/og-image.png", width: 1200, height: 630 }],
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
        </LocaleProvider>
        <NativeProvider />
        <Toaster
          theme="light"
          position="bottom-right"
          richColors
          closeButton
        />
        <Analytics />
        <CookieBanner />
      </body>
    </html>
  );
}
