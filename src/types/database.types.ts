/**
 * Hand-written types matching `supabase/migrations/0001_init.sql`.
 * Regenerate from real DB later with:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Hours = Partial<
  Record<
    "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
    { open: string; close: string } | null
  >
>;

export type Socials = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
};

export type SeoMeta = {
  title?: string;
  description?: string;
  og_image?: string;
};

export type UnitRow = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  banner_url: string | null;
  address: string | null;
  maps_url: string | null;
  whatsapp: string | null;
  phone: string | null;
  buk_url: string | null;
  hours: Hours | null;
  socials: Socials | null;
  seo: SeoMeta | null;
  active: boolean;
  created_at: string;
};

export type BarberRow = {
  id: string;
  unit_id: string;
  slug: string;
  name: string;
  photo_url: string | null;
  speciality: string | null;
  description: string | null;
  socials: Socials | null;
  buk_url: string | null;
  display_order: number;
  active: boolean;
};

export type ProductCategoryRow = {
  id: string;
  unit_id: string;
  name: string;
  slug: string;
  display_order: number;
};

export type ProductRow = {
  id: string;
  unit_id: string;
  category_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  active: boolean;
};

export type ProfileRow = {
  id: string;
  role: "super_admin" | "manager";
  unit_id: string | null;
  created_at: string;
};

export type EventType =
  | "page_view"
  | "booking_click"
  | "product_view"
  | "barber_view"
  | "whatsapp_checkout"
  | "add_to_cart";

export type EventRow = {
  id: number;
  unit_id: string | null;
  type: EventType;
  ref_id: string | null;
  meta: Json | null;
  created_at: string;
};

type Insert<R> = Partial<R> & { [key: string]: unknown };

export interface Database {
  public: {
    Tables: {
      units: { Row: UnitRow; Insert: Insert<UnitRow>; Update: Partial<UnitRow>; Relationships: [] };
      barbers: { Row: BarberRow; Insert: Insert<BarberRow>; Update: Partial<BarberRow>; Relationships: [] };
      product_categories: { Row: ProductCategoryRow; Insert: Insert<ProductCategoryRow>; Update: Partial<ProductCategoryRow>; Relationships: [] };
      products: { Row: ProductRow; Insert: Insert<ProductRow>; Update: Partial<ProductRow>; Relationships: [] };
      profiles: { Row: ProfileRow; Insert: Insert<ProfileRow>; Update: Partial<ProfileRow>; Relationships: [] };
      events: { Row: EventRow; Insert: Insert<EventRow>; Update: Partial<EventRow>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type CartItem = {
  product_id: string;
  unit_slug: string;
  name: string;
  slug: string;
  price_cents: number;
  image_url: string | null;
  quantity: number;
};
