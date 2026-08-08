"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Hours, SeoMeta, Socials } from "@/types/database.types";

/**
 * Guardas por role.
 *
 * Antes isto era um `assertAdmin()` que só confirmava que existia um perfil,
 * sem olhar ao role. Como Server Actions são endpoints HTTP públicos e estas
 * acções usam o service role (que ignora a RLS), qualquer utilizador
 * autenticado — incluindo um barbeiro, que tem login para a operação — podia
 * apagar uma unidade.
 *
 * O `try/catch` que existia à volta também era um problema: o `redirect()` do
 * Next funciona lançando um NEXT_REDIRECT, e o catch cancelava o envio para
 * /login ao convertê-lo num erro genérico.
 */

/** Estrutura do negócio: unidades e barbeiros. Alinha com a RLS `admin_all_units`. */
const ownerOnly = () => requireRole(["super_admin"]);

/** Catálogo: produtos, categorias e uploads. Um manager trata da sua loja. */
const catalogStaff = () => requireRole(["super_admin", "manager"]);

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
  hero_video_url?: string | null;
  hours?: Hours | null;
  socials?: Socials | null;
  seo?: SeoMeta | null;
  active?: boolean;
};

export async function saveUnit(input: UnitInput) {
  await ownerOnly();
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
  await ownerOnly();
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
  await ownerOnly();
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
  await ownerOnly();
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
  compare_at_price_cents?: number | null;
  stock?: number;
  out_of_stock?: boolean;
  featured?: boolean;
  image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  active?: boolean;
};

export async function saveProduct(input: ProductInput) {
  await catalogStaff();
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
  await catalogStaff();
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
  await catalogStaff();
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
  await catalogStaff();
  const sb = createAdminClient();
  const { error } = await sb.from("product_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

const ALLOWED_UPLOAD_EXTS = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif",
  ".mp4", ".webm", ".mov",
]);

export async function getUploadSignedUrl(
  bucket: "units" | "barbers" | "products",
  path: string,
): Promise<{ signedUrl: string; publicUrl: string }> {
  await catalogStaff();

  const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_UPLOAD_EXTS.has(ext)) throw new Error("Tipo de ficheiro não permitido.");

  const sb = createAdminClient();

  const { error: bucketError } = await sb.storage.getBucket(bucket);
  if (bucketError && /not found/i.test(bucketError.message)) {
    await sb.storage.createBucket(bucket, { public: true });
  }

  const { data, error } = await sb.storage.from(bucket).createSignedUploadUrl(path);
  if (error) throw new Error(error.message);

  const { data: urlData } = sb.storage.from(bucket).getPublicUrl(path);
  return { signedUrl: data.signedUrl, publicUrl: urlData.publicUrl };
}

export async function uploadImage(
  bucket: "units" | "barbers" | "products",
  path: string,
  file: File,
): Promise<string> {
  await catalogStaff();

  const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_UPLOAD_EXTS.has(ext)) throw new Error("Tipo de ficheiro não permitido.");

  const sb = createAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const opts = { contentType: file.type, upsert: true };

  let { error } = await sb.storage.from(bucket).upload(path, arrayBuffer, opts);
  if (error && /bucket not found/i.test(error.message)) {
    await sb.storage.createBucket(bucket, { public: true });
    ({ error } = await sb.storage.from(bucket).upload(path, arrayBuffer, opts));
  }
  if (error) throw new Error(error.message);

  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
