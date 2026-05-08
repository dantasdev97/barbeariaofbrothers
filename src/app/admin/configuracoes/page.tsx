import Link from "next/link";
import { ArrowRight, Code2, Settings2 } from "lucide-react";
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
      <header className="mb-7 border-b border-border pb-6">
        <h1 className="font-heading text-[32px] font-semibold leading-none tracking-tight">
          Configurações
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Logo, banner, SEO, redes sociais, contactos e horários — geridos por unidade.
        </p>
      </header>

      {/* Units grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(units ?? []).map((u) => (
          <Link
            key={u.id}
            href={`/admin/unidades/${u.id}`}
            className="group relative flex items-center justify-between rounded-2xl border border-border bg-bg-surface p-6 transition-all duration-200 hover:border-brand/40 hover:bg-background hover:shadow-lg hover:shadow-brand/5"
          >
            <div>
              <p className="font-heading text-lg font-semibold transition group-hover:text-brand">
                {u.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
                  /{u.slug}
                </code>
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-brand" />
          </Link>
        ))}
      </div>

      {/* Global config info */}
      <div className="rounded-2xl border border-border bg-bg-surface p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <Settings2 className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-semibold">Configuração global</h2>
            <p className="text-sm text-muted-foreground">Ficheiros partilhados por todas as unidades</p>
          </div>
        </div>

        <p className="mb-5 text-sm text-muted-foreground leading-relaxed">
          O logo, favicon e SEO globais ficam nos ficheiros de código-fonte. Para alterar:
        </p>

        <ul className="space-y-3">
          {[
            {
              label: "Logo e favicon",
              path: "public/logo.png",
              detail: "Substituir os ficheiros na pasta public/",
            },
            {
              label: "Metadata global",
              path: "src/app/layout.tsx",
              detail: "Editar os campos de metadata na raiz do layout",
            },
            {
              label: "Paleta de cores",
              path: "src/app/globals.css",
              detail: "Alterar as variáveis CSS do design system",
            },
          ].map((item) => (
            <li key={item.path} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand/10">
                <Code2 className="h-3 w-3 text-brand" />
              </div>
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
                <code className="mt-1 inline-block rounded bg-background px-2 py-0.5 font-mono text-xs text-brand">
                  {item.path}
                </code>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 border-t border-border pt-6">
          <Button asChild className="bg-brand text-primary-foreground hover:bg-brand-hover">
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
