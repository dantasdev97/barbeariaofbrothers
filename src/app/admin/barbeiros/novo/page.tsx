import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { BarberForm } from "../barber-form";

export default async function NewBarberPage() {
  const sb = createAdminClient();
  const { data: units } = await sb
    .from("units")
    .select("id, name, slug")
    .order("name");
  return (
    <div>
      <Link
        href="/admin/barbeiros"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Barbeiros
      </Link>
      <header className="mb-7 border-b border-border pb-6">
        <h1 className="font-heading text-[32px] font-semibold leading-none tracking-tight">
          Novo barbeiro
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Preencha os dados e guarde para adicionar à equipa.
        </p>
      </header>
      <BarberForm units={units ?? []} />
    </div>
  );
}
