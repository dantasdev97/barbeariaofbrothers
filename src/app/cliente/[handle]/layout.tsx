import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  // Área privada do cliente: noindex ao nível do layout para que qualquer rota
  // acrescentada sob `/cliente` fique coberta por omissão.
  robots: { index: false, follow: false },
  alternates: { canonical: null },
  manifest: "/manifest-cliente.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Of Brothers",
    statusBarStyle: "default",
  },
};

export default function CartaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
