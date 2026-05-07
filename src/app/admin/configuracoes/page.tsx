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
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Logo, banner, SEO, redes sociais, contactos e horários — geridos por
          unidade.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {(units ?? []).map((u) => (
          <Link
            key={u.id}
            href={`/admin/unidades/${u.id}`}
            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-bg-surface p-6 transition hover:border-brand/40 hover:shadow-premium"
          >
            <div>
              <p className="font-heading text-lg font-semibold">{u.name}</p>
              <p className="text-sm text-muted-foreground">/{u.slug}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:text-brand" />
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-bg-surface p-6">
        <h2 className="font-heading text-lg font-semibold">Configuração global</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O logo, favicon e SEO globais ficam em <code>src/app/layout.tsx</code>{" "}
          e <code>public/</code>. Para alterar:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            Substituir <code>public/logo.png</code> e <code>public/favicon.ico</code>
          </li>
          <li>
            Editar metadata em <code>src/app/layout.tsx</code>
          </li>
          <li>
            Alterar paleta em <code>src/app/globals.css</code>
          </li>
        </ul>
        <div className="mt-4">
          <Button asChild variant="outline" className="border-white/15 bg-white/5">
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir Vercel Dashboard
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
