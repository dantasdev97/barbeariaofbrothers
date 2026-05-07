import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Acesso administrativo",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12">
      <div className="bg-grid absolute inset-0 -z-10 opacity-30" />

      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-bg-surface p-8 shadow-premium-lg">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Barbearia Of Brothers"
            width={56}
            height={56}
            className="h-14 w-auto"
            priority
          />
          <h1 className="mt-4 font-heading text-2xl font-semibold">
            Painel administrativo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inicie sessão para gerir as unidades.
          </p>
        </div>

        <div className="mt-8">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-white/5" />}>
            <LoginForm />
          </Suspense>
        </div>

        <Link
          href="/"
          className="mt-6 block text-center text-xs text-muted-foreground hover:text-brand"
        >
          ← Voltar ao site
        </Link>
      </div>
    </div>
  );
}
