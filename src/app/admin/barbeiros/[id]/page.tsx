import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
      <Link
        href="/admin/barbeiros"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Barbeiros
      </Link>
      <header className="mb-7 border-b border-border pb-6">
        <h1 className="font-heading text-[32px] font-semibold leading-none tracking-tight">
          {barber.name}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Editar informações do barbeiro.
        </p>
      </header>
      <BarberForm initial={barber} units={units ?? []} />
    </div>
  );
}
