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
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold">Categorias</h1>
        <p className="text-sm text-muted-foreground">
          Organize os produtos por categoria por unidade.
        </p>
      </header>
      <CategoriesManager
        initialCategories={categories ?? []}
        units={units ?? []}
      />
    </div>
  );
}
