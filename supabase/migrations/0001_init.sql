-- =====================================================================
-- Barbearia Of Brothers — initial schema
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.units (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  logo_url    text,
  banner_url  text,
  address     text,
  maps_url    text,
  whatsapp    text,
  phone       text,
  buk_url     text,
  hours       jsonb,
  socials     jsonb,
  seo         jsonb,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.barbers (
  id            uuid primary key default gen_random_uuid(),
  unit_id       uuid not null references public.units(id) on delete cascade,
  slug          text not null,
  name          text not null,
  photo_url     text,
  speciality    text,
  description   text,
  socials       jsonb,
  buk_url       text,
  display_order int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (unit_id, slug)
);

create table if not exists public.product_categories (
  id            uuid primary key default gen_random_uuid(),
  unit_id       uuid not null references public.units(id) on delete cascade,
  name          text not null,
  slug          text not null,
  display_order int not null default 0,
  unique (unit_id, slug)
);

create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  unit_id          uuid not null references public.units(id) on delete cascade,
  category_id      uuid references public.product_categories(id) on delete set null,
  slug             text not null,
  name             text not null,
  description      text,
  price_cents      int not null check (price_cents >= 0),
  image_url        text,
  seo_title        text,
  seo_description  text,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (unit_id, slug)
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'super_admin' check (role in ('super_admin', 'manager')),
  unit_id     uuid references public.units(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.events (
  id          bigserial primary key,
  unit_id     uuid references public.units(id) on delete set null,
  type        text not null check (type in (
    'page_view', 'booking_click', 'product_view',
    'barber_view', 'whatsapp_checkout', 'add_to_cart'
  )),
  ref_id      uuid,
  meta        jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists events_unit_type_created
  on public.events (unit_id, type, created_at desc);

create index if not exists barbers_unit_active_order
  on public.barbers (unit_id, active, display_order);

create index if not exists products_unit_active
  on public.products (unit_id, active);

-- ---------------------------------------------------------------------
-- Helper: is_super_admin()
-- ---------------------------------------------------------------------

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- ---------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------

alter table public.units              enable row level security;
alter table public.barbers            enable row level security;
alter table public.product_categories enable row level security;
alter table public.products           enable row level security;
alter table public.profiles           enable row level security;
alter table public.events             enable row level security;

-- Public read of active records
drop policy if exists "public_read_active_units" on public.units;
create policy "public_read_active_units"
  on public.units for select
  using (active = true);

drop policy if exists "public_read_active_barbers" on public.barbers;
create policy "public_read_active_barbers"
  on public.barbers for select
  using (active = true);

drop policy if exists "public_read_active_products" on public.products;
create policy "public_read_active_products"
  on public.products for select
  using (active = true);

drop policy if exists "public_read_categories" on public.product_categories;
create policy "public_read_categories"
  on public.product_categories for select
  using (true);

-- Profiles: a user can read its own profile; admins read all
drop policy if exists "self_or_admin_read_profile" on public.profiles;
create policy "self_or_admin_read_profile"
  on public.profiles for select
  using (id = auth.uid() or public.is_super_admin());

-- Events: anyone can insert; only admins can read
drop policy if exists "public_insert_events" on public.events;
create policy "public_insert_events"
  on public.events for insert
  with check (true);

drop policy if exists "admin_read_events" on public.events;
create policy "admin_read_events"
  on public.events for select
  using (public.is_super_admin());

-- Admin write everywhere
drop policy if exists "admin_all_units" on public.units;
create policy "admin_all_units"
  on public.units for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "admin_all_barbers" on public.barbers;
create policy "admin_all_barbers"
  on public.barbers for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "admin_all_categories" on public.product_categories;
create policy "admin_all_categories"
  on public.product_categories for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "admin_all_products" on public.products;
create policy "admin_all_products"
  on public.products for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "admin_all_profiles" on public.profiles;
create policy "admin_all_profiles"
  on public.profiles for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ---------------------------------------------------------------------
-- Storage buckets (public read; writes restricted by service role)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('units',    'units',    true),
  ('barbers',  'barbers',  true),
  ('products', 'products', true)
on conflict (id) do nothing;

-- Public read on these buckets is granted automatically (public = true).
-- All writes go through the service-role client (bypasses RLS).
