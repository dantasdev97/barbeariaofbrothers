import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  manifest: "/manifest-cliente.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Of Brothers",
    statusBarStyle: "black-translucent",
  },
};

export default function CartaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
