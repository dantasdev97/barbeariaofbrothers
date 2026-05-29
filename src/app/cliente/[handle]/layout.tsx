import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
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
