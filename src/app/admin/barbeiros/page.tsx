import Link from "next/link";
import { Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { BarbersTable } from "./barbers-table";


export default async function BarbersAdminPage() {
  const sb = createAdminClient();
  const [{ data: barbers }, { data: units }] = await Promise.all([
    sb.from("barbers").select("*").order("display_order"),
    sb.from("units").select("id, name, slug").order("name"),
  ]);

  return (
    <div>
      <header className="mb-7 flex items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-[32px] font-semibold leading-none tracking-tight">
            Barbeiros
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {barbers?.length ?? 0} barbeiro{(barbers?.length ?? 0) !== 1 ? "s" : ""} · todas as unidades
          </p>
        </div>
        <Button asChild className="shrink-0 bg-brand text-primary-foreground hover:bg-brand-hover">
          <Link href="/admin/barbeiros/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo barbeiro
          </Link>
        </Button>
      </header>

      <BarbersTable barbers={barbers ?? []} units={units ?? []} />
    </div>
  );
}
