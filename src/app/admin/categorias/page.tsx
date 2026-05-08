import { createAdminClient } from "@/lib/supabase/admin";
import { CategoriesManager } from "./categories-manager";


export default async function CategoriesPage() {
  const sb = createAdminClient();
  const [{ data: categories }, { data: units }] = await Promise.all([
    sb.from("product_categories").select("*").order("display_order"),
    sb.from("units").select("id, name").order("name"),
  ]);

  return (
    <div>
      <header className="mb-5 border-b border-border pb-5 sm:mb-7 sm:pb-6">
        <h1 className="font-heading text-2xl font-semibold leading-none tracking-tight sm:text-[32px]">
          Categorias
        </h1>
        <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
          {categories?.length ?? 0} categoria{(categories?.length ?? 0) !== 1 ? "s" : ""} · organize por unidade
        </p>
      </header>
      <CategoriesManager
        initialCategories={categories ?? []}
        units={units ?? []}
      />
    </div>
  );
}
