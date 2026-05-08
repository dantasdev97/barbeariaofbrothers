import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { UnitForm } from "../unit-form";

export default function NewUnitPage() {
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
          Nova unidade
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Crie uma nova barbearia e configure os seus detalhes.
        </p>
      </header>
      <div className="max-w-3xl">
        <UnitForm />
      </div>
    </div>
  );
}
