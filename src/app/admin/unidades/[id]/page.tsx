import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
    <div>
      <Link
        href="/admin/unidades"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Unidades
      </Link>
      <header className="mb-7 border-b border-border pb-6">
        <h1 className="font-heading text-[32px] font-semibold leading-none tracking-tight">
          {unit.name}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Editar informações e configurações da unidade.
        </p>
      </header>
      <div className="max-w-3xl">
        <UnitForm initial={unit} />
      </div>
    </div>
  );
}
