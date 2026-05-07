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
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Unidades</h1>
          <p className="text-sm text-muted-foreground">
            Gerir as suas barbearias.
          </p>
        </div>
        <Button asChild className="bg-brand text-primary-foreground hover:bg-brand-hover">
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
