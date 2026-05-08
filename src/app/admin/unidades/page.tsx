import Link from "next/link";
import { Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { UnitsTable } from "./units-table";


export default async function UnitsPage() {
  const sb = createAdminClient();
  const { data: units } = await sb
    .from("units")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div>
      <header className="mb-7 flex items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-[32px] font-semibold leading-none tracking-tight">
            Unidades
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {units?.length ?? 0} barbearia{(units?.length ?? 0) !== 1 ? "s" : ""} · gerir localizações
          </p>
        </div>
        <Button asChild className="shrink-0 bg-brand text-primary-foreground hover:bg-brand-hover">
          <Link href="/admin/unidades/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova unidade
          </Link>
        </Button>
      </header>

      <UnitsTable units={units ?? []} />
    </div>
  );
}
