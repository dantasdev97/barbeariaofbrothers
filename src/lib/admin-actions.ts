"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Hours, SeoMeta, Socials } from "@/types/database.types";

async function requireAdmin() {
  try {
    return await assertAdmin();
  } catch {
    throw new Error("Sem permissao.");
  }
}

function bustUnitTags(slug?: string | null) {
  revalidatePath("/");
  if (slug) revalidatePath(`/${slug}`);
  revalidatePath("/admin", "layout");
}

type UnitInput = {
  id?: string;
  slug: string;
  name: string;
  address?: string | null;
  maps_url?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  buk_url?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  hours?: Hours | null;
  socials?: Socials | null;
  seo?: SeoMeta | null;
  active?: boolean;
};

export async function saveUnit(input: UnitInput) {
  await requireAdmin();
  const sb = createAdminClient();
  if (input.id) {
    const { error } = await sb.from("units").update(input).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from("units").insert(input);
    if (error) throw new Error(error.message);
  }
  bustUnitTags(input.slug);
  return { ok: true };
}

export async function deleteUnit(id: string, slug: string) {
  await requireAdmin();
  const sb = createAdminClient();
  const { error } = await sb.from("units").delete().eq("id", id);
  if (error) throw new Error(error.message);
  bustUnitTags(slug);
  return { ok: true };
}

type BarberInput = {
  id?: string;
  unit_id: string;
  slug: string;
  name: string;
  speciality?: string | null;
  description?: string | null;
  photo_url?: string | null;
  buk_url?: string | null;
  socials?: Socials | null;
  display_order?: number;
  active?: boolean;
};

export async function saveBarber(input: BarberInput) {
  await requireAdmin();
  const sb = createAdminClient();
  if (input.id) {
    const { error } = await sb.from("barbers").update(input).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from("barbers").insert(input);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteBarber(id: string, _unitId?: string) {
  void _unitId;
  await requireAdmin();
  const sb = createAdminClient();
  const { error } = await sb.from("barbers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

type ProductInput = {
  id?: string;
  unit_id: string;
  category_id?: string | null;
  slug: string;
  name: string;
  description?: string | null;
  price_cents: number;
  image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  active?: boolean;
};

export async function saveProduct(input: ProductInput) {
  await requireAdmin();
  const sb = createAdminClient();
  if (input.id) {
    const { error } = await sb.from("products").update(input).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from("products").insert(input);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteProduct(id: string, _unitId?: string) {
  void _unitId;
  await requireAdmin();
  const sb = createAdminClient();
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

type CategoryInput = {
  id?: string;
  unit_id: string;
  name: string;
  slug: string;
  display_order?: number;
};

export async function saveCategory(input: CategoryInput) {
  await requireAdmin();
  const sb = createAdminClient();
  if (input.id) {
    const { error } = await sb
      .from("product_categories")
      .update(input)
      .eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from("product_categories").insert(input);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteCategory(id: string, _unitId?: string) {
  void _unitId;
  await requireAdmin();
  const sb = createAdminClient();
  const { error } = await sb.from("product_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function uploadImage(
  bucket: "units" | "barbers" | "products",
  path: string,
  file: File,
): Promise<string> {
  await requireAdmin();
  const sb = createAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await sb.storage.from(bucket).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
