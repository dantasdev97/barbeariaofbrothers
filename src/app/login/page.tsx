import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Acesso administrativo",
  robots: { index: false, follow: false },
  // Sem isto herdava o canonical do root layout e declarava-se como homepage.
  alternates: { canonical: null },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12">
      <div className="bg-grid absolute inset-0 -z-10 opacity-20" />

      <div className="w-full max-w-md">
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 -z-10 bg-brand/20 blur-2xl rounded-full h-32 w-32 mx-auto" />
            <Image
              src="/logo.png"
              alt="Barbearia Of Brothers"
              width={100}
              height={100}
              className="h-24 w-auto relative z-10"
              priority
            />
          </div>
          <h1 className="font-heading text-3xl font-bold">
            Bem-vindo de volta
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Inicia sessão para gerir o teu painel.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-bg-surface p-8 shadow-premium-lg backdrop-blur">
          <div className="mt-2">
            <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-white/5" />}>
              <LoginForm />
            </Suspense>
          </div>

          <Link
            href="/"
            className="mt-6 block text-center text-xs text-muted-foreground hover:text-brand transition"
          >
            ← Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}
