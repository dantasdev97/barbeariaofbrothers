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
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold">Novo barbeiro</h1>
      </header>
      <BarberForm units={units ?? []} />
    </div>
  );
}
