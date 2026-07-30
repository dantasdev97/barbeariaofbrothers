-- =====================================================================
-- Barbearia Of Brothers — Pontos de bónus editáveis pelo admin
-- =====================================================================
-- Até aqui o bónus de registo (50 pts) e o de seguir no Instagram (30 pts)
-- estavam fixos dentro das funções `loyalty_create_card` e
-- `loyalty_grant_bonus` (0007_client_accounts.sql). O dono pediu para poder
-- ajustar esses valores pelo painel, por unidade, sem depender de código.
--
-- Fica uma tabela pequena (unit_id, kind, points, active) e as duas funções
-- passam a ler dela em vez de teres o valor escrito no corpo do plpgsql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. loyalty_bonuses
-- ---------------------------------------------------------------------

create table if not exists public.loyalty_bonuses (
  id          uuid primary key default gen_random_uuid(),
  unit_id     uuid not null references public.units(id) on delete cascade,
  kind        text not null check (kind in ('signup', 'instagram')),
  points      int  not null check (points > 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (unit_id, kind)
);

-- Backfill: preserva os valores actuais (50/30) como ponto de partida
-- editável, para nenhuma unidade ficar sem bónus configurado depois desta
-- migração — sem isto, `loyalty_create_card` não teria de onde ler o valor.
insert into public.loyalty_bonuses (unit_id, kind, points)
select id, 'signup', 50 from public.units
on conflict (unit_id, kind) do nothing;

insert into public.loyalty_bonuses (unit_id, kind, points)
select id, 'instagram', 30 from public.units
on conflict (unit_id, kind) do nothing;

-- ---------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------

alter table public.loyalty_bonuses enable row level security;

-- Público lê só os activos: é o que /programa mostra a quem ainda não
-- tem conta, antes de saber a quem pertence.
drop policy if exists "public_read_active_bonuses" on public.loyalty_bonuses;
create policy "public_read_active_bonuses"
  on public.loyalty_bonuses for select
  using (active = true);

drop policy if exists "staff_read_bonuses" on public.loyalty_bonuses;
create policy "staff_read_bonuses"
  on public.loyalty_bonuses for select
  using (public.is_staff());

drop policy if exists "manager_write_bonuses" on public.loyalty_bonuses;
create policy "manager_write_bonuses"
  on public.loyalty_bonuses for all
  using (public.is_manager())
  with check (public.is_manager());

-- ---------------------------------------------------------------------
-- 3. Funções — ler da tabela em vez do valor fixo
-- ---------------------------------------------------------------------

-- Mesma assinatura de 0007_client_accounts.sql; troca só o `v_bonus int := 50`
-- por uma leitura à tabela nova, com 50 como rede de segurança caso a
-- unidade ainda não tenha linha (não deve acontecer, por causa do backfill
-- acima, mas uma unidade nova criada depois desta migração passaria por
-- aqui antes de alguém configurar o bónus dela).
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
  v_bonus int;
begin
  if v_user is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

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

  select points into v_bonus
  from public.loyalty_bonuses
  where unit_id = p_unit_id and kind = 'signup' and active = true;
  v_bonus := coalesce(v_bonus, 50);

  insert into public.loyalty_transactions
    (client_id, unit_id, actor_user_id, type, points, bonus_kind, note)
  values
    (v_client.id, p_unit_id, v_user, 'bonus', v_bonus, 'signup', 'Bónus de registo')
  on conflict do nothing;

  return v_client;
end;
$$;

-- Mesma assinatura de 0007; troca o `case p_kind when 'signup' then 50 ...`
-- por uma leitura à tabela. Se a unidade tiver desactivado o bónus (ou não
-- tiver linha), recusa com a mesma mensagem de "bónus desconhecido" —
-- do ponto de vista do cliente é indiferente se está desligado ou nunca
-- existiu, o botão simplesmente não deve aparecer (tratado no client-actions).
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

  if p_kind not in ('signup', 'instagram') then
    raise exception 'bónus desconhecido: %', p_kind using errcode = '22023';
  end if;

  select points into v_points
  from public.loyalty_bonuses
  where unit_id = p_unit_id and kind = p_kind and active = true;

  if v_points is null then
    raise exception 'bónus indisponível para esta unidade' using errcode = '22023';
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
