"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { ProductCategoryRow, ProductRow, UnitRow } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductsTable } from "./products-table";
import { ProductForm } from "./product-form";

type UnitLite = Pick<UnitRow, "id" | "name" | "slug">;

export function ProductsClient({
  products,
  units,
  categories,
}: {
  products: ProductRow[];
  units: UnitLite[];
  categories: ProductCategoryRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(p: ProductRow) {
    setEditing(p);
    setOpen(true);
  }

  function handleSuccess() {
    setOpen(false);
    setEditing(null);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Produtos"
        description={`${products.length} produto${
          products.length !== 1 ? "s" : ""
        } · catálogo geral`}
        actions={
          <Button
            onClick={openNew}
            className="bg-brand text-primary-foreground hover:bg-brand-hover"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo produto
          </Button>
        }
      />

      <ProductsTable
        products={products}
        units={units}
        onEdit={openEdit}
        onAdd={openNew}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Editar — ${editing.name}` : "Novo produto"}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            units={units}
            categories={categories}
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
