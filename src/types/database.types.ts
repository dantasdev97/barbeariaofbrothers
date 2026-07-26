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
  push_token: string | null;
  push_platform: "ios" | "android" | null;
  created_at: string;
};

export type ClientRow = {
  id: string;
  unit_id: string;
  name: string;
  /** Opcional desde 0007: quem se regista pelo Google dá email, não telefone. */
  phone: string | null;
  email: string | null;
  qr_token: string;
  public_slug: string;
  notes: string | null;
  /** Conta do cliente, criada ao entrar com o Google. */
  auth_user_id: string | null;
  claimed_at: string | null;
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

/**
 * Tipo de recompensa:
 *  service → um serviço do menu (corte, sobrancelha, depilação de nariz)
 *  amount  → desconto de valor fixo, em cêntimos
 *  percent → desconto percentual
 *  gift    → brinde da marca (boné, t-shirt)
 */
export type LoyaltyRewardKind = "service" | "amount" | "percent" | "gift";

export type LoyaltyRewardRow = {
  id: string;
  unit_id: string;
  name: string;
  description: string | null;
  points_cost: number;
  kind: LoyaltyRewardKind;
  /** Só para kind = "amount". Cêntimos: 1000 = 10 €. */
  value_cents: number | null;
  /** Só para kind = "percent". 10 = 10 %. */
  percent: number | null;
  active: boolean;
  created_at: string;
};

export type LoyaltyTxType = "earn" | "redeem" | "adjust" | "bonus";

/** Bónus atribuíveis uma única vez por cliente. */
export type LoyaltyBonusKind = "signup" | "instagram";

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
  bonus_kind: LoyaltyBonusKind | null;
  note: string | null;
  created_at: string;
};

export type LoyaltyCouponStatus = "active" | "used" | "expired";

export type LoyaltyCouponRow = {
  id: string;
  /** Legível em voz alta ao balcão: OB-XXXX-XXXX, sem caracteres ambíguos. */
  code: string;
  client_id: string;
  unit_id: string;
  reward_id: string | null;
  transaction_id: string | null;
  /** Cópia do que a recompensa valia ao resgatar — editá-la depois não muda o cupom. */
  reward_label: string;
  reward_kind: LoyaltyRewardKind;
  value_cents: number | null;
  percent: number | null;
  points_spent: number;
  status: LoyaltyCouponStatus;
  expires_at: string | null;
  used_at: string | null;
  used_by_user_id: string | null;
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
  | "add_to_cart"
  /** Clique no botão fixo que leva ao programa de pontos. */
  | "loyalty_click";

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
      loyalty_coupons: { Row: LoyaltyCouponRow; Insert: Insert<LoyaltyCouponRow>; Update: Partial<LoyaltyCouponRow>; Relationships: [] };
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
      save_push_token: {
        Args: { p_token: string; p_platform: string | null };
        Returns: undefined;
      };
      loyalty_create_card: {
        Args: { p_unit_id: string; p_name: string | null };
        Returns: ClientRow;
      };
      loyalty_self_redeem: {
        Args: { p_reward_id: string; p_unit_id: string };
        Returns: LoyaltyCouponRow;
      };
      loyalty_grant_bonus: {
        Args: { p_kind: string; p_unit_id: string };
        Returns: LoyaltyTransactionRow;
      };
      loyalty_consume_coupon: {
        Args: { p_code: string };
        Returns: LoyaltyCouponRow;
      };
      current_client_id: {
        Args: Record<string, never>;
        Returns: string | null;
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
