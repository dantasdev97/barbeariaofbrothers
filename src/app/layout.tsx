import type { Metadata, Viewport } from "next";
import { Poppins, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
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
    default: "Barbearia Of Brothers — Since 2012",
    template: "%s · Barbearia Of Brothers",
  },
  description:
    "Barbearia Of Brothers — corte, barba e estilo desde 2012. Agende online com os nossos barbeiros e descubra os nossos produtos.",
  applicationName: "Barbearia Of Brothers",
  authors: [{ name: "Barbearia Of Brothers" }],
  icons: {
    icon: [
      { rel: "icon", url: "/favicon.ico" },
      { rel: "icon", url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { rel: "icon", url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/favicon-192x192.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_PT",
    siteName: "Barbearia Of Brothers",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#F39200",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-PT"
      className={`${poppins.variable} ${spaceGrotesk.variable} dark h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
        />
        <Analytics />
      </body>
    </html>
  );
}
