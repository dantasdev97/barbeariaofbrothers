import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { UnitForm } from "../unit-form";


export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = createAdminClient();
  const { data: unit } = await sb
    .from("units")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!unit) notFound();

  return (
    <div className="max-w-3xl">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold">{unit.name}</h1>
        <p className="text-sm text-muted-foreground">Editar unidade.</p>
      </header>
      <UnitForm initial={unit} />
    </div>
  );
}
