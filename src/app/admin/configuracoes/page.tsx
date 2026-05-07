import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";


export default async function ConfigPage() {
  const sb = createAdminClient();
  const { data: units } = await sb
    .from("units")
    .select("*")
    .order("created_at");

  return (
    <div>
      <header className="mb-10">
        <h1 className="font-heading text-4xl font-bold">Configurações</h1>
        <p className="mt-2 text-base text-muted-foreground leading-relaxed">
          Logo, banner, SEO, redes sociais, contactos e horários — geridos por unidade.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {(units ?? []).map((u) => (
          <Link
            key={u.id}
            href={`/admin/unidades/${u.id}`}
            className="group relative flex items-center justify-between rounded-xl border border-white/10 bg-bg-surface p-6 transition-all duration-300 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/10 hover:bg-bg-surface/80"
          >
            <div>
              <p className="font-heading text-lg font-semibold group-hover:text-brand transition">{u.name}</p>
              <p className="text-sm text-muted-foreground mt-1">/{u.slug}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:text-brand group-hover:translate-x-1" />
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-bg-surface p-8">
        <h2 className="font-heading text-2xl font-bold">Configuração global</h2>
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">
          O logo, favicon e SEO globais ficam em <code className="px-2 py-1 bg-white/5 rounded text-brand">src/app/layout.tsx</code> e <code className="px-2 py-1 bg-white/5 rounded text-brand">public/</code>. Para alterar:
        </p>
        <ul className="mt-5 space-y-3 list-none">
          <li className="flex items-start gap-3 text-muted-foreground">
            <span className="inline-block w-2 h-2 mt-2 rounded-full bg-brand/60" />
            <span>Substituir <code className="px-2 py-1 bg-white/5 rounded text-brand">public/logo.png</code> e <code className="px-2 py-1 bg-white/5 rounded text-brand">public/favicon.ico</code></span>
          </li>
          <li className="flex items-start gap-3 text-muted-foreground">
            <span className="inline-block w-2 h-2 mt-2 rounded-full bg-brand/60" />
            <span>Editar metadata em <code className="px-2 py-1 bg-white/5 rounded text-brand">src/app/layout.tsx</code></span>
          </li>
          <li className="flex items-start gap-3 text-muted-foreground">
            <span className="inline-block w-2 h-2 mt-2 rounded-full bg-brand/60" />
            <span>Alterar paleta em <code className="px-2 py-1 bg-white/5 rounded text-brand">src/app/globals.css</code></span>
          </li>
        </ul>
        <div className="mt-8">
          <Button asChild className="bg-brand hover:bg-brand-hover">
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir Vercel Dashboard →
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
