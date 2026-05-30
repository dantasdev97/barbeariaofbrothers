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
        <main className="flex-1 overflow-auto px-4 py-5 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      <MobileTabBar role={profile.role} />
    </div>
  );
}
