-- =====================================================================
-- Barbearia Of Brothers — Loyalty / Cartão Fidelidade
-- =====================================================================
-- Adiciona o módulo de fidelidade digital:
--   • role 'barbeiro' em profiles
--   • barbers.auth_user_id (link para auth.users)
--   • clients (cadastro com QR token único)
--   • loyalty_services / loyalty_rewards (config por unidade)
--   • loyalty_transactions (única fonte de verdade de pontos)
--   • view client_unit_balances (saldo derivado por unidade)
--   • RPCs loyalty_earn / loyalty_redeem / loyalty_adjust
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Alterar tabelas existentes
-- ---------------------------------------------------------------------

-- Adicionar 'barbeiro' ao enum de role.
alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'manager', 'barbeiro'));

-- Ligar barber (catálogo público) à conta auth (login operacional).
alter table public.barbers
  add column if not exists auth_user_id uuid
    references auth.users(id) on delete set null;

create unique index if not exists barbers_auth_user_id_uidx
  on public.barbers (auth_user_id)
  where auth_user_id is not null;

-- ---------------------------------------------------------------------
-- 2. Tabelas novas
-- ---------------------------------------------------------------------

create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  unit_id     uuid not null references public.units(id) on delete restrict,
  name        text not null,
  phone       text not null unique,
  email       text,
  qr_token    text not null unique,
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists clients_unit_created
  on public.clients (unit_id, created_at desc);

create index if not exists clients_phone_idx
  on public.clients (phone);

create table if not exists public.loyalty_services (
  id            uuid primary key default gen_random_uuid(),
  unit_id       uuid not null references public.units(id) on delete cascade,
  name          text not null,
  points_value  int  not null check (points_value > 0),
  display_order int  not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists loyalty_services_unit_active
  on public.loyalty_services (unit_id, active, display_order);

create table if not exists public.loyalty_rewards (
  id           uuid primary key default gen_random_uuid(),
  unit_id      uuid not null references public.units(id) on delete cascade,
  name         text not null,
  description  text,
  points_cost  int  not null check (points_cost > 0),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists loyalty_rewards_unit_active
  on public.loyalty_rewards (unit_id, active);

create table if not exists public.loyalty_transactions (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  unit_id         uuid not null references public.units(id) on delete restrict,
  barber_id       uuid references public.barbers(id) on delete set null,
  actor_user_id   uuid references auth.users(id) on delete set null,
  type            text not null check (type in ('earn','redeem','adjust')),
  points          int  not null,
  service_id      uuid references public.loyalty_services(id) on delete set null,
  reward_id       uuid references public.loyalty_rewards(id)  on delete set null,
  note            text,
  created_at      timestamptz not null default now(),
  -- coerência: 'earn' soma, 'redeem' subtrai, 'adjust' qualquer sinal
  constraint loyalty_tx_points_sign check (
    (type = 'earn'   and points > 0)
    or (type = 'redeem' and points < 0)
    or  type = 'adjust'
  )
);

create index if not exists loyalty_tx_client_unit_created
  on public.loyalty_transactions (client_id, unit_id, created_at desc);

create index if not exists loyalty_tx_unit_created
  on public.loyalty_transactions (unit_id, created_at desc);

-- ---------------------------------------------------------------------
-- 3. View: saldo por (cliente, unidade)
-- ---------------------------------------------------------------------

create or replace view public.client_unit_balances as
  select
    client_id,
    unit_id,
    coalesce(sum(points), 0)::int as balance
  from public.loyalty_transactions
  group by client_id, unit_id;

-- ---------------------------------------------------------------------
-- 4. Helpers
-- ---------------------------------------------------------------------

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_unit_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select unit_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_barbeiro()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'barbeiro', false);
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('manager','super_admin'), false);
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('barbeiro','manager','super_admin'), false);
$$;

-- ---------------------------------------------------------------------
-- 5. RPCs (única forma de criar transações)
-- ---------------------------------------------------------------------

create or replace function public.loyalty_earn(
  p_client_id uuid,
  p_unit_id   uuid,
  p_service_id uuid
)
returns public.loyalty_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_role  text := public.current_role();
  v_unit_profile uuid := public.current_unit_id();
  v_barber_id uuid;
  v_points int;
  v_tx public.loyalty_transactions;
begin
  if v_actor is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  if v_role not in ('super_admin','manager','barbeiro') then
    raise exception 'sem permissao' using errcode = '42501';
  end if;

  -- Não-super_admin só opera na própria unidade
  if v_role <> 'super_admin' and v_unit_profile is not null and v_unit_profile <> p_unit_id then
    raise exception 'unidade fora do escopo' using errcode = '42501';
  end if;

  -- Resolver linha do barbeiro a partir do actor (auditoria)
  select id into v_barber_id from public.barbers where auth_user_id = v_actor;

  -- Buscar serviço ativo da unidade
  select points_value into v_points
  from public.loyalty_services
  where id = p_service_id and unit_id = p_unit_id and active = true;

  if v_points is null then
    raise exception 'serviço inválido ou inativo' using errcode = '22023';
  end if;

  insert into public.loyalty_transactions
    (client_id, unit_id, barber_id, actor_user_id, type, points, service_id, note)
  values
    (p_client_id, p_unit_id, v_barber_id, v_actor, 'earn', v_points, p_service_id, null)
  returning * into v_tx;

  return v_tx;
end;
$$;

create or replace function public.loyalty_redeem(
  p_client_id uuid,
  p_unit_id   uuid,
  p_reward_id uuid
)
returns public.loyalty_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_role  text := public.current_role();
  v_unit_profile uuid := public.current_unit_id();
  v_barber_id uuid;
  v_cost int;
  v_balance int;
  v_tx public.loyalty_transactions;
begin
  if v_actor is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  if v_role not in ('super_admin','manager','barbeiro') then
    raise exception 'sem permissao' using errcode = '42501';
  end if;

  if v_role <> 'super_admin' and v_unit_profile is not null and v_unit_profile <> p_unit_id then
    raise exception 'unidade fora do escopo' using errcode = '42501';
  end if;

  select id into v_barber_id from public.barbers where auth_user_id = v_actor;

  -- Bloquear linha do cliente para serialização sob concorrência
  perform 1 from public.clients where id = p_client_id for update;

  select points_cost into v_cost
  from public.loyalty_rewards
  where id = p_reward_id and unit_id = p_unit_id and active = true;

  if v_cost is null then
    raise exception 'recompensa inválida ou inativa' using errcode = '22023';
  end if;

  select coalesce(sum(points),0) into v_balance
  from public.loyalty_transactions
  where client_id = p_client_id and unit_id = p_unit_id;

  if v_balance < v_cost then
    raise exception 'saldo insuficiente (% < %)', v_balance, v_cost using errcode = '23514';
  end if;

  insert into public.loyalty_transactions
    (client_id, unit_id, barber_id, actor_user_id, type, points, reward_id, note)
  values
    (p_client_id, p_unit_id, v_barber_id, v_actor, 'redeem', -v_cost, p_reward_id, null)
  returning * into v_tx;

  return v_tx;
end;
$$;

create or replace function public.loyalty_adjust(
  p_client_id uuid,
  p_unit_id   uuid,
  p_points    int,
  p_note      text
)
returns public.loyalty_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_tx public.loyalty_transactions;
begin
  if not public.is_super_admin() then
    raise exception 'apenas super_admin' using errcode = '42501';
  end if;

  if p_points = 0 then
    raise exception 'ajuste com 0 pontos' using errcode = '22023';
  end if;

  if p_note is null or btrim(p_note) = '' then
    raise exception 'motivo obrigatório' using errcode = '22023';
  end if;

  insert into public.loyalty_transactions
    (client_id, unit_id, barber_id, actor_user_id, type, points, note)
  values
    (p_client_id, p_unit_id, null, v_actor, 'adjust', p_points, p_note)
  returning * into v_tx;

  return v_tx;
end;
$$;

-- Permitir chamada das RPCs por utilizadores autenticados (RLS interna decide).
grant execute on function public.loyalty_earn   (uuid, uuid, uuid)            to authenticated;
grant execute on function public.loyalty_redeem (uuid, uuid, uuid)            to authenticated;
grant execute on function public.loyalty_adjust (uuid, uuid, int, text)       to authenticated;

-- ---------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------

alter table public.clients              enable row level security;
alter table public.loyalty_services     enable row level security;
alter table public.loyalty_rewards      enable row level security;
alter table public.loyalty_transactions enable row level security;

-- CLIENTS
-- Staff (barbeiro/manager/super_admin) lê todos (cliente é global; saldo é por unidade).
drop policy if exists "staff_read_clients" on public.clients;
create policy "staff_read_clients"
  on public.clients for select
  using (public.is_staff());

-- Apenas super_admin/manager escreve clients.
drop policy if exists "manager_write_clients" on public.clients;
create policy "manager_write_clients"
  on public.clients for all
  using (public.is_manager())
  with check (public.is_manager());

-- LOYALTY_SERVICES
drop policy if exists "staff_read_services" on public.loyalty_services;
create policy "staff_read_services"
  on public.loyalty_services for select
  using (public.is_staff());

drop policy if exists "public_read_active_services" on public.loyalty_services;
create policy "public_read_active_services"
  on public.loyalty_services for select
  using (active = true);

drop policy if exists "manager_write_services" on public.loyalty_services;
create policy "manager_write_services"
  on public.loyalty_services for all
  using (public.is_manager())
  with check (public.is_manager());

-- LOYALTY_REWARDS
drop policy if exists "staff_read_rewards" on public.loyalty_rewards;
create policy "staff_read_rewards"
  on public.loyalty_rewards for select
  using (public.is_staff());

drop policy if exists "public_read_active_rewards" on public.loyalty_rewards;
create policy "public_read_active_rewards"
  on public.loyalty_rewards for select
  using (active = true);

drop policy if exists "manager_write_rewards" on public.loyalty_rewards;
create policy "manager_write_rewards"
  on public.loyalty_rewards for all
  using (public.is_manager())
  with check (public.is_manager());

-- LOYALTY_TRANSACTIONS
-- Insert apenas via RPCs SECURITY DEFINER (sem policy de insert → bloqueado).
drop policy if exists "staff_read_transactions" on public.loyalty_transactions;
create policy "staff_read_transactions"
  on public.loyalty_transactions for select
  using (public.is_staff());

-- Manager/barbeiro só vê transações da própria unidade; super_admin tudo (já abrangido por is_staff + filtro app-side).
-- Para impor a unidade no DB:
drop policy if exists "scope_unit_transactions" on public.loyalty_transactions;
create policy "scope_unit_transactions"
  on public.loyalty_transactions for select
  using (
    public.current_role() = 'super_admin'
    or unit_id = public.current_unit_id()
  );

-- BARBERS — permitir que o próprio barbeiro leia a sua linha (para resolver auth_user_id no cliente)
drop policy if exists "self_read_own_barber" on public.barbers;
create policy "self_read_own_barber"
  on public.barbers for select
  using (auth_user_id = auth.uid());
