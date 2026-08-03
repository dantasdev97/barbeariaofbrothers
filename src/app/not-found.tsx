import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFoundMetadata } from "@/lib/seo";

export const metadata: Metadata = notFoundMetadata();

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-brand">
        404
      </p>
      <h1 className="mt-2 font-heading text-4xl font-semibold sm:text-5xl">
        Página não encontrada
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Não conseguimos encontrar o que procura. Talvez tenha mudado de sítio?
      </p>
      <Button
        asChild
        className="mt-8 bg-brand text-primary-foreground hover:bg-brand-hover"
      >
        <Link href="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
