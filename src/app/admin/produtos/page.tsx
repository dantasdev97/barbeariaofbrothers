import Link from "next/link";
import { Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { ProductsTable } from "./products-table";


export default async function ProductsAdmin() {
  const sb = createAdminClient();
  const [{ data: products }, { data: units }] = await Promise.all([
    sb.from("products").select("*").order("name"),
    sb.from("units").select("id, name, slug").order("name"),
  ]);
  return (
    <div>
      <header className="mb-7 flex items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-[32px] font-semibold leading-none tracking-tight">
            Produtos
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {products?.length ?? 0} produto{(products?.length ?? 0) !== 1 ? "s" : ""} · catálogo geral
          </p>
        </div>
        <Button asChild className="shrink-0 bg-brand text-primary-foreground hover:bg-brand-hover">
          <Link href="/admin/produtos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo produto
          </Link>
        </Button>
      </header>
      <ProductsTable products={products ?? []} units={units ?? []} />
    </div>
  );
}
