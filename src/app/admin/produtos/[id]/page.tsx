import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductForm } from "../product-form";


export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = createAdminClient();
  const [{ data: product }, { data: units }, { data: categories }] = await Promise.all([
    sb.from("products").select("*").eq("id", id).maybeSingle(),
    sb.from("units").select("id, name").order("name"),
    sb.from("product_categories").select("*").order("name"),
  ]);
  if (!product) notFound();

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold">{product.name}</h1>
      </header>
      <ProductForm
        initial={product}
        units={units ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
