import { createAdminClient } from "@/lib/supabase/admin";
import { ProductsClient } from "./products-client";

export default async function ProductsAdmin() {
  const sb = createAdminClient();
  const [{ data: products }, { data: units }, { data: categories }] =
    await Promise.all([
      sb.from("products").select("*").order("name"),
      sb.from("units").select("id, name, slug").order("name"),
      sb.from("product_categories").select("*").order("display_order"),
    ]);

  return (
    <ProductsClient
      products={products ?? []}
      units={units ?? []}
      categories={categories ?? []}
    />
  );
}
