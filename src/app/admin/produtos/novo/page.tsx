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
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold">Novo produto</h1>
      </header>
      <ProductForm units={units ?? []} categories={categories ?? []} />
    </div>
  );
}
