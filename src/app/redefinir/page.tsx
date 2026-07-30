import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAllUnits } from "@/lib/data";
import { ClientShell } from "@/components/cliente/client-shell";
import { ResetForm } from "./reset-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nova palavra-passe",
  robots: { index: false, follow: false },
};

export default async function RedefinirPage() {
  const units = await getAllUnits();
  const shellUnit = units[0] ?? null;

  const content = (
    <div className="flex min-h-[60vh] flex-1 flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="page-enter">
          <Image src="/logo.png" alt="" width={56} height={56} className="mb-6" />
          <h1 className="font-heading text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">
            Escolha uma palavra-passe nova
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Depois de guardar, entra directamente no seu cartão.
          </p>

          <ResetForm />

          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            Enganou-se?{" "}
            <Link href="/entrar" className="underline underline-offset-2">
              Voltar a entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );

  if (!shellUnit) return <main className="flex-1">{content}</main>;

  return (
    <ClientShell unit={shellUnit} units={units}>
      {content}
    </ClientShell>
  );
}
