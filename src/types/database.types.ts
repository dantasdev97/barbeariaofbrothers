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
  hero_video_url: string | null;
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
  auth_user_id: string | null;
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
  compare_at_price_cents: number | null;
  stock: number;
  out_of_stock: boolean;
  featured: boolean;
  image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  active: boolean;
};

export type ProfileRole = "super_admin" | "manager" | "barbeiro";

export type ProfileRow = {
  id: string;
  role: ProfileRole;
  unit_id: string | null;
  created_at: string;
};

export type ClientRow = {
  id: string;
  unit_id: string;
  name: string;
  phone: string;
  email: string | null;
  qr_token: string;
  public_slug: string;
  notes: string | null;
  created_at: string;
};

export type LoyaltyServiceRow = {
  id: string;
  unit_id: string;
  name: string;
  points_value: number;
  display_order: number;
  active: boolean;
  created_at: string;
};

export type LoyaltyRewardRow = {
  id: string;
  unit_id: string;
  name: string;
  description: string | null;
  points_cost: number;
  active: boolean;
  created_at: string;
};

export type LoyaltyTxType = "earn" | "redeem" | "adjust";

export type LoyaltyTransactionRow = {
  id: string;
  client_id: string;
  unit_id: string;
  barber_id: string | null;
  actor_user_id: string | null;
  type: LoyaltyTxType;
  points: number;
  service_id: string | null;
  reward_id: string | null;
  note: string | null;
  created_at: string;
};

export type ClientUnitBalanceRow = {
  client_id: string;
  unit_id: string;
  balance: number;
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
      clients: { Row: ClientRow; Insert: Insert<ClientRow>; Update: Partial<ClientRow>; Relationships: [] };
      loyalty_services: { Row: LoyaltyServiceRow; Insert: Insert<LoyaltyServiceRow>; Update: Partial<LoyaltyServiceRow>; Relationships: [] };
      loyalty_rewards: { Row: LoyaltyRewardRow; Insert: Insert<LoyaltyRewardRow>; Update: Partial<LoyaltyRewardRow>; Relationships: [] };
      loyalty_transactions: { Row: LoyaltyTransactionRow; Insert: Insert<LoyaltyTransactionRow>; Update: Partial<LoyaltyTransactionRow>; Relationships: [] };
    };
    Views: {
      client_unit_balances: { Row: ClientUnitBalanceRow; Relationships: [] };
    };
    Functions: {
      loyalty_earn: {
        Args: { p_client_id: string; p_unit_id: string; p_service_id: string };
        Returns: LoyaltyTransactionRow;
      };
      loyalty_redeem: {
        Args: { p_client_id: string; p_unit_id: string; p_reward_id: string };
        Returns: LoyaltyTransactionRow;
      };
      loyalty_adjust: {
        Args: { p_client_id: string; p_unit_id: string; p_points: number; p_note: string };
        Returns: LoyaltyTransactionRow;
      };
    };
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
