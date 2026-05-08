import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/admin-auth";
import { ProductsClient } from "./products-client";

export default async function ProductsAdmin() {
  await requireAdminSession();
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
