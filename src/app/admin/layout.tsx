import type { Metadata, Viewport } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileTabBar } from "@/components/admin/mobile-tab-bar";

/**
 * Metadata do admin: define o admin como PWA instalável
 * ("Adicionar ao ecrã principal" em iOS / "Instalar app" em Android).
 * O scope do manifest é /admin/, por isso só estas páginas são tratadas como app.
 */
export const metadata: Metadata = {
  title: { default: "Of Brothers · Admin", template: "%s · OB Admin" },
  // O `Disallow: /admin` do robots.txt impede o crawl mas não impede que o URL
  // seja indexado sem conteúdo. O noindex aqui cobre as 17 páginas do painel,
  // que antes herdavam `index: true` do root layout.
  robots: { index: false, follow: false },
  alternates: { canonical: null },
  manifest: "/manifest-admin.webmanifest",
  appleWebApp: {
    capable: true,
    title: "OB Admin",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#F39200",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin shell is always dynamic (auth-gated)
  const { user, profile } = await requireAdminSession();

  return (
    <div className="admin flex min-h-[100dvh] flex-col bg-background md:flex-row">
      <AdminSidebar
        email={user.email ?? ""}
        role={profile.role}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* O padding inferior abre espaço para a bottom tab bar (mobile) e
         * respeita o home indicator do iOS. No desktop não há barra. */}
        <main className="flex-1 overflow-auto px-4 py-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:p-8 md:pb-8 lg:p-10 lg:pb-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      <MobileTabBar role={profile.role} />
    </div>
  );
}
