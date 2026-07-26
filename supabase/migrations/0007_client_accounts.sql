-- =====================================================================
-- Barbearia Of Brothers — Contas de cliente, auto-resgate e cupons
-- =====================================================================
-- Até aqui o cartão de fidelidade era operado só pelo staff: o barbeiro
-- lançava os pontos e o barbeiro é que resgatava. Esta migração abre o
-- programa ao cliente:
--
--   • clients.auth_user_id — o cliente passa a ter conta própria
--   • loyalty_rewards ganha tipo (serviço / valor / percentagem / brinde)
--   • loyalty_coupons — o resgate deixa de ser só uma linha no livro-razão
--     e passa a produzir um código que o cliente mostra na barbearia
--   • transações do tipo 'bonus' (registo, Instagram), uma vez por cliente
--   • RPCs para o cliente agir sobre o próprio cartão, com RLS a condizer
--
-- Tudo aditivo: nenhuma coluna ou tabela é removida, e as linhas que já
-- existem continuam válidas com os valores por omissão.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. clients — ligação à conta
-- ---------------------------------------------------------------------

-- Mesmo padrão de barbers.auth_user_id (0004_loyalty.sql), para o cartão
-- poder pertencer a um utilizador autenticado.
alter table public.clients
  add column if not exists auth_user_id uuid
    references auth.users(id) on delete set null;

create unique index if not exists clients_auth_user_id_uidx
  on public.clients (auth_user_id)
  where auth_user_id is not null;

-- Quem se regista pelo Google dá email, não telefone. O unique mantém-se
-- (no Postgres vários NULL não colidem), só deixa de ser obrigatório.
alter table public.clients
  alter column phone drop not null;

-- Marca o momento em que o cartão foi reclamado, para auditoria.
alter table public.clients
  add column if not exists claimed_at timestamptz;

-- ---------------------------------------------------------------------
-- 2. loyalty_rewards — os tipos que o dono pediu
-- ---------------------------------------------------------------------
-- 'service'  → um serviço do menu (corte, sobrancelha, depilação de nariz)
-- 'amount'   → desconto de valor fixo, em cêntimos (1000 = 10 €)
-- 'percent'  → desconto percentual (10 = 10 %)
-- 'gift'     → brinde físico da marca (boné, t-shirt)

alter table public.loyalty_rewards
  add column if not exists kind text not null default 'service';

alter table public.loyalty_rewards
  add column if not exists value_cents int;

alter table public.loyalty_rewards
  add column if not exists percent int;

alter table public.loyalty_rewards
  drop constraint if exists loyalty_rewards_kind_check;
alter table public.loyalty_rewards
  add constraint loyalty_rewards_kind_check
  check (kind in ('service', 'amount', 'percent', 'gift'));

-- Cada tipo só faz sentido com o seu campo preenchido. Sem isto seria
-- possível guardar um desconto de valor sem valor nenhum.
alter table public.loyalty_rewards
  drop constraint if exists loyalty_rewards_kind_value_check;
alter table public.loyalty_rewards
  add constraint loyalty_rewards_kind_value_check
  check (
    (kind = 'amount'  and value_cents is not null and value_cents > 0)
    or (kind = 'percent' and percent is not null and percent between 1 and 100)
    or (kind in ('service', 'gift'))
  );

-- ---------------------------------------------------------------------
-- 3. loyalty_transactions — bónus
-- ---------------------------------------------------------------------
-- 'bonus' cobre o bónus de registo e o de seguir no Instagram. Some
-- sempre, e não tem serviço nem recompensa associados.

alter table public.loyalty_transactions
  add column if not exists bonus_kind text;

alter table public.loyalty_transactions
  drop constraint if exists loyalty_transactions_type_check;
alter table public.loyalty_transactions
  add constraint loyalty_transactions_type_check
  check (type in ('earn', 'redeem', 'adjust', 'bonus'));

alter table public.loyalty_transactions
  drop constraint if exists loyalty_tx_points_sign;
alter table public.loyalty_transactions
  add constraint loyalty_tx_points_sign check (
    (type = 'earn'   and points > 0)
    or (type = 'redeem' and points < 0)
    or (type = 'bonus'  and points > 0)
    or  type = 'adjust'
  );

-- É este índice que impede o cliente de reclamar o mesmo bónus duas vezes.
create unique index if not exists loyalty_tx_bonus_once_uidx
  on public.loyalty_transactions (client_id, bonus_kind)
  where bonus_kind is not null;

-- ---------------------------------------------------------------------
-- 4. loyalty_coupons
-- ---------------------------------------------------------------------

create table if not exists public.loyalty_coupons (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  client_id        uuid not null references public.clients(id) on delete cascade,
  unit_id          uuid not null references public.units(id)   on delete restrict,
  reward_id        uuid references public.loyalty_rewards(id)  on delete set null,
  transaction_id   uuid references public.loyalty_transactions(id) on delete set null,
  -- Cópia do que a recompensa valia no momento do resgate. Se o dono
  -- editar a recompensa depois, o cupom já emitido não muda de valor.
  reward_label     text not null,
  reward_kind      text not null,
  value_cents      int,
  percent          int,
  points_spent     int  not null check (points_spent > 0),
  status           text not null default 'active'
                     check (status in ('active', 'used', 'expired')),
  expires_at       timestamptz,
  used_at          timestamptz,
  used_by_user_id  uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now()
);

create index if not exists loyalty_coupons_client_status
  on public.loyalty_coupons (client_id, status, created_at desc);

create index if not exists loyalty_coupons_unit_created
  on public.loyalty_coupons (unit_id, created_at desc);

-- ---------------------------------------------------------------------
-- 5. Helpers
-- ---------------------------------------------------------------------

-- O cartão do utilizador autenticado. Usado pelas RPCs e pelas policies.
create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.clients where auth_user_id = auth.uid();
$$;

/**
 * Código de cupom legível em voz alta.
 *
 * O cliente vai ditar isto ao barbeiro ao balcão, por isso o alfabeto
 * exclui os caracteres que se confundem a falar ou a ler: 0/O, 1/I/L,
 * 5/S, 2/Z. Formato OB-XXXX-XXXX.
 */
create or replace function public.generate_coupon_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRTUVWXY346789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
    if i = 4 then
      result := result || '-';
    end if;
  end loop;
  return 'OB-' || result;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. RPCs do cliente
-- ---------------------------------------------------------------------

/**
 * Cria um cartão novo para quem se regista pelo Google.
 *
 * Este é o caminho **normal** de entrada: a maior parte das pessoas que
 * cria conta nunca teve cartão físico, e não faz sentido pedir-lhes que
 * validem nada. Entram, o cartão nasce vazio, e a partir daí acumulam.
 *
 * `loyalty_claim_card` fica só para o caso inverso — quem já tinha cartão
 * de papel com pontos e quer trazê-los para a conta.
 *
 * O bónus de registo entra na mesma transação: se o cartão existe, o bónus
 * existe, sem estado intermédio possível.
 */
create or replace function public.loyalty_create_card(
  p_unit_id uuid,
  p_name    text default null
)
returns public.clients
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_name text;
  v_client public.clients;
  v_token text;
  v_slug text;
  v_attempts int := 0;
  v_bonus int := 50;
begin
  if v_user is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  -- Idempotente: se já tem cartão, devolve o que existe em vez de rebentar.
  -- O utilizador pode carregar duas vezes ou voltar atrás no browser.
  select * into v_client from public.clients where auth_user_id = v_user;
  if v_client.id is not null then
    return v_client;
  end if;

  if not exists (select 1 from public.units where id = p_unit_id and active = true) then
    raise exception 'unidade inválida' using errcode = '22023';
  end if;

  select email into v_email from auth.users where id = v_user;
  v_name := coalesce(
    nullif(btrim(p_name), ''),
    nullif(btrim((select raw_user_meta_data ->> 'full_name' from auth.users where id = v_user)), ''),
    split_part(coalesce(v_email, 'Cliente'), '@', 1)
  );

  loop
    v_attempts := v_attempts + 1;
    -- Mesmo formato do qr_token gerado pelo admin, para os dois caminhos
    -- produzirem cartões indistinguíveis.
    v_token := upper(
      substr(replace(gen_random_uuid()::text, '-', ''), 1, 16) || '-' ||
      substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)
    );
    v_slug := public.slugify(v_name) || '-' || substr(v_token, 1, 4);

    begin
      insert into public.clients
        (unit_id, name, phone, email, qr_token, public_slug, auth_user_id, claimed_at)
      values
        (p_unit_id, v_name, null, v_email, v_token, lower(v_slug), v_user, now())
      returning * into v_client;
      exit;
    exception when unique_violation then
      if v_attempts >= 5 then
        raise exception 'não foi possível criar o cartão' using errcode = '23505';
      end if;
    end;
  end loop;

  -- Bónus de boas-vindas. O índice único (client_id, bonus_kind) garante
  -- que não se repete se esta função for chamada outra vez.
  insert into public.loyalty_transactions
    (client_id, unit_id, actor_user_id, type, points, bonus_kind, note)
  values
    (v_client.id, p_unit_id, v_user, 'bonus', v_bonus, 'signup', 'Bónus de registo')
  on conflict do nothing;

  return v_client;
end;
$$;

/**
 * Liga um cartão que JÁ EXISTE à conta autenticada.
 *
 * A prova de propriedade é a posse do handle: o qr_token impresso no
 * cartão físico ou o public_slug do link. Quem tem o cartão na mão é o
 * dono. Recusa se o cartão já tiver sido reclamado por outra conta.
 */
create or replace function public.loyalty_claim_card(p_handle text)
returns public.clients
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_client public.clients;
  v_handle text := btrim(p_handle);
begin
  if v_user is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  if v_handle = '' then
    raise exception 'cartão inválido' using errcode = '22023';
  end if;

  -- Uma conta, um cartão.
  if exists (select 1 from public.clients where auth_user_id = v_user) then
    raise exception 'esta conta já tem um cartão associado' using errcode = '23505';
  end if;

  select * into v_client
  from public.clients
  where qr_token = v_handle or public_slug = v_handle
  for update;

  if v_client.id is null then
    raise exception 'cartão não encontrado' using errcode = 'P0002';
  end if;

  if v_client.auth_user_id is not null then
    if v_client.auth_user_id = v_user then
      return v_client;
    end if;
    raise exception 'este cartão já pertence a outra conta' using errcode = '42501';
  end if;

  update public.clients
  set auth_user_id = v_user,
      claimed_at = now(),
      email = coalesce(email, (select email from auth.users where id = v_user))
  where id = v_client.id
  returning * into v_client;

  return v_client;
end;
$$;

/**
 * Resgate feito pelo próprio cliente.
 *
 * Diferente de loyalty_redeem (0004), que exige role de staff: aqui quem
 * age é o dono do cartão. Desconta os pontos e emite o cupom na mesma
 * transação — nunca pode existir um sem o outro.
 */
create or replace function public.loyalty_self_redeem(
  p_reward_id uuid,
  p_unit_id   uuid
)
returns public.loyalty_coupons
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_client_id uuid;
  v_reward public.loyalty_rewards;
  v_balance int;
  v_tx public.loyalty_transactions;
  v_coupon public.loyalty_coupons;
  v_code text;
  v_attempts int := 0;
begin
  if v_user is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  select id into v_client_id from public.clients where auth_user_id = v_user;
  if v_client_id is null then
    raise exception 'conta sem cartão associado' using errcode = '42501';
  end if;

  -- Serializa contra duplo-toque / duas abas.
  perform 1 from public.clients where id = v_client_id for update;

  select * into v_reward
  from public.loyalty_rewards
  where id = p_reward_id and unit_id = p_unit_id and active = true;

  if v_reward.id is null then
    raise exception 'recompensa inválida ou inactiva' using errcode = '22023';
  end if;

  select coalesce(sum(points), 0) into v_balance
  from public.loyalty_transactions
  where client_id = v_client_id and unit_id = p_unit_id;

  if v_balance < v_reward.points_cost then
    raise exception 'saldo insuficiente (% < %)', v_balance, v_reward.points_cost
      using errcode = '23514';
  end if;

  insert into public.loyalty_transactions
    (client_id, unit_id, actor_user_id, type, points, reward_id, note)
  values
    (v_client_id, p_unit_id, v_user, 'redeem', -v_reward.points_cost,
     v_reward.id, 'Resgate pelo cliente')
  returning * into v_tx;

  -- Colisão de código é improvável, mas o unique é que manda.
  loop
    v_attempts := v_attempts + 1;
    v_code := public.generate_coupon_code();
    begin
      insert into public.loyalty_coupons
        (code, client_id, unit_id, reward_id, transaction_id, reward_label,
         reward_kind, value_cents, percent, points_spent, expires_at)
      values
        (v_code, v_client_id, p_unit_id, v_reward.id, v_tx.id, v_reward.name,
         v_reward.kind, v_reward.value_cents, v_reward.percent,
         v_reward.points_cost, now() + interval '90 days')
      returning * into v_coupon;
      exit;
    exception when unique_violation then
      if v_attempts >= 5 then
        raise exception 'não foi possível gerar código único' using errcode = '23505';
      end if;
    end;
  end loop;

  return v_coupon;
end;
$$;

/**
 * Bónus de registo e de Instagram. O índice único em (client_id,
 * bonus_kind) é a verdadeira barreira contra repetição; aqui damos só a
 * mensagem amigável.
 */
create or replace function public.loyalty_grant_bonus(
  p_kind    text,
  p_unit_id uuid
)
returns public.loyalty_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_client_id uuid;
  v_points int;
  v_tx public.loyalty_transactions;
begin
  if v_user is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  select id into v_client_id from public.clients where auth_user_id = v_user;
  if v_client_id is null then
    raise exception 'conta sem cartão associado' using errcode = '42501';
  end if;

  v_points := case p_kind
    when 'signup'    then 50
    when 'instagram' then 30
    else null
  end;

  if v_points is null then
    raise exception 'bónus desconhecido: %', p_kind using errcode = '22023';
  end if;

  if exists (
    select 1 from public.loyalty_transactions
    where client_id = v_client_id and bonus_kind = p_kind
  ) then
    raise exception 'bónus já atribuído' using errcode = '23505';
  end if;

  insert into public.loyalty_transactions
    (client_id, unit_id, actor_user_id, type, points, bonus_kind, note)
  values
    (v_client_id, p_unit_id, v_user, 'bonus', v_points, p_kind,
     case p_kind
       when 'signup' then 'Bónus de registo'
       when 'instagram' then 'Seguiu no Instagram'
     end)
  returning * into v_tx;

  return v_tx;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. RPC do staff — dar baixa no cupom
-- ---------------------------------------------------------------------

/**
 * Marca o cupom como usado. É isto que impede o mesmo código de valer
 * dez cortes: a segunda tentativa encontra status <> 'active' e recusa.
 * O código é normalizado (maiúsculas, sem espaços) porque o barbeiro vai
 * escrevê-lo à mão.
 */
create or replace function public.loyalty_consume_coupon(p_code text)
returns public.loyalty_coupons
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_coupon public.loyalty_coupons;
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
begin
  if v_user is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  if not public.is_staff() then
    raise exception 'sem permissão' using errcode = '42501';
  end if;

  if v_code = '' then
    raise exception 'código vazio' using errcode = '22023';
  end if;

  select * into v_coupon
  from public.loyalty_coupons
  where code = v_code
  for update;

  if v_coupon.id is null then
    raise exception 'cupom não encontrado' using errcode = 'P0002';
  end if;

  if v_coupon.status = 'used' then
    raise exception 'cupom já utilizado em %',
      to_char(v_coupon.used_at, 'DD/MM/YYYY HH24:MI') using errcode = '23505';
  end if;

  if v_coupon.status = 'expired'
     or (v_coupon.expires_at is not null and v_coupon.expires_at < now()) then
    raise exception 'cupom expirado' using errcode = '23514';
  end if;

  update public.loyalty_coupons
  set status = 'used',
      used_at = now(),
      used_by_user_id = v_user
  where id = v_coupon.id
  returning * into v_coupon;

  return v_coupon;
end;
$$;

grant execute on function public.loyalty_create_card   (uuid, text) to authenticated;
grant execute on function public.loyalty_claim_card    (text)       to authenticated;
grant execute on function public.loyalty_self_redeem   (uuid, uuid) to authenticated;
grant execute on function public.loyalty_grant_bonus   (text, uuid) to authenticated;
grant execute on function public.loyalty_consume_coupon(text)       to authenticated;
grant execute on function public.current_client_id     ()           to authenticated;

-- ---------------------------------------------------------------------
-- 8. RLS
-- ---------------------------------------------------------------------

alter table public.loyalty_coupons enable row level security;

-- CLIENTS — o dono lê e edita a sua própria linha (nome/email), sem poder
-- mexer em unidade, pontos ou no token do cartão.
drop policy if exists "self_read_own_client" on public.clients;
create policy "self_read_own_client"
  on public.clients for select
  using (auth_user_id = auth.uid());

-- LOYALTY_TRANSACTIONS — o cliente vê o próprio histórico.
-- As policies de staff (0004) continuam a valer em paralelo.
drop policy if exists "self_read_own_transactions" on public.loyalty_transactions;
create policy "self_read_own_transactions"
  on public.loyalty_transactions for select
  using (client_id = public.current_client_id());

-- LOYALTY_COUPONS
drop policy if exists "self_read_own_coupons" on public.loyalty_coupons;
create policy "self_read_own_coupons"
  on public.loyalty_coupons for select
  using (client_id = public.current_client_id());

drop policy if exists "staff_read_coupons" on public.loyalty_coupons;
create policy "staff_read_coupons"
  on public.loyalty_coupons for select
  using (public.is_staff());

-- Insert e update só pelas RPCs security definer: sem policy de escrita,
-- ninguém escreve directamente na tabela.
