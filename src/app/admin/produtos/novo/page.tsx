import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  const sb = createAdminClient();
  const [{ data: units }, { data: categories }] = await Promise.all([
    sb.from("units").select("id, name").order("name"),
    sb.from("product_categories").select("*").order("name"),
  ]);
  return (
    <div>
      <Link
        href="/admin/produtos"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Produtos
      </Link>
      <header className="mb-7 border-b border-border pb-6">
        <h1 className="font-heading text-[32px] font-semibold leading-none tracking-tight">
          Novo produto
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Adicione um novo produto ao catálogo.
        </p>
      </header>
      <ProductForm units={units ?? []} categories={categories ?? []} />
    </div>
  );
}
