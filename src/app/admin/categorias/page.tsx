import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/admin-auth";
import { CategoriesManager } from "./categories-manager";


export default async function CategoriesPage() {
  await requireAdminSession();
  const sb = createAdminClient();
  const [{ data: categories }, { data: units }] = await Promise.all([
    sb.from("product_categories").select("*").order("display_order"),
    sb.from("units").select("id, name").order("name"),
  ]);

  return (
    <div>
      <header className="mb-7 border-b border-border pb-6">
        <h1 className="font-heading text-[32px] font-semibold leading-none tracking-tight">
          Categorias
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
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
