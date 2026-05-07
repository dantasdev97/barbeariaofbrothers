import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { BarberForm } from "../barber-form";


export default async function EditBarberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = createAdminClient();
  const [{ data: barber }, { data: units }] = await Promise.all([
    sb.from("barbers").select("*").eq("id", id).maybeSingle(),
    sb.from("units").select("id, name, slug").order("name"),
  ]);
  if (!barber) notFound();

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold">{barber.name}</h1>
      </header>
      <BarberForm initial={barber} units={units ?? []} />
    </div>
  );
}
