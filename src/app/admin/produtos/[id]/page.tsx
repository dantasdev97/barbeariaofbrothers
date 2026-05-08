import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
      <Link
        href="/admin/produtos"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Produtos
      </Link>
      <header className="mb-7 border-b border-border pb-6">
        <h1 className="font-heading text-[32px] font-semibold leading-none tracking-tight">
          {product.name}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Editar informações do produto.
        </p>
      </header>
      <ProductForm
        initial={product}
        units={units ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
