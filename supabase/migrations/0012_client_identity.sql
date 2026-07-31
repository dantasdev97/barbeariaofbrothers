-- 0012_client_identity.sql
-- Identidade do cliente no painel e confirmação do nome no cartão:
--   1. saber se a conta veio do Google ou do formulário de email
--   2. guardar a foto de perfil quando o Google a devolve
--   3. marcar se o cliente já confirmou como quer ser tratado
--
-- Idempotente: pode correr duas vezes sem efeito diferente.

-- ---------------------------------------------------------------------
-- 1. Colunas novas
-- ---------------------------------------------------------------------

alter table public.clients
  add column if not exists auth_provider text;

alter table public.clients
  add column if not exists avatar_url text;

-- O nome vem do Google ou da parte do email antes do @, e nenhum dos dois é
-- necessariamente como a pessoa quer ser tratada. Este sinalizador é o que faz
-- o cartão perguntar uma vez — e não voltar a perguntar depois de respondido.
alter table public.clients
  add column if not exists name_confirmed boolean not null default false;

-- ---------------------------------------------------------------------
-- 2. Backfill dos clientes que já têm conta
-- ---------------------------------------------------------------------
-- `raw_app_meta_data->>'provider'` é onde o Supabase grava quem autenticou:
-- 'google' no OAuth, 'email' no formulário. A foto vem no metadata do
-- utilizador, com nome diferente conforme o provider.

update public.clients c
set
  auth_provider = coalesce(
    u.raw_app_meta_data ->> 'provider',
    case when c.auth_user_id is not null then 'email' end
  ),
  avatar_url = coalesce(
    nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(u.raw_user_meta_data ->> 'picture', '')
  )
from auth.users u
where u.id = c.auth_user_id
  and c.auth_provider is null;

-- Quem já usa o cartão não deve ser interrompido com o popup: dá-se o nome
-- actual por confirmado. O popup fica só para quem criar conta a partir daqui.
update public.clients
set name_confirmed = true
where auth_user_id is not null and name_confirmed = false;

-- ---------------------------------------------------------------------
-- 3. loyalty_create_card guarda a origem e a foto
-- ---------------------------------------------------------------------
-- Mesma assinatura da 0008 — só acrescenta o que se grava na criação. O nome
-- continua a sair do Google quando existe, mas nasce por confirmar, para o
-- cartão poder perguntar uma vez.

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
  v_provider text;
  v_avatar text;
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

  select
    u.email,
    coalesce(u.raw_app_meta_data ->> 'provider', 'email'),
    coalesce(
      nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(u.raw_user_meta_data ->> 'picture', '')
    )
  into v_email, v_provider, v_avatar
  from auth.users u where u.id = v_user;

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
        (unit_id, name, phone, email, qr_token, public_slug, auth_user_id,
         claimed_at, auth_provider, avatar_url, name_confirmed)
      values
        (p_unit_id, v_name, null, v_email, v_token, lower(v_slug), v_user,
         now(), v_provider, v_avatar, false)
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
  v_bonus := coalesce(v_bonus, 10);

  insert into public.loyalty_transactions
    (client_id, unit_id, actor_user_id, type, points, bonus_kind, note)
  values
    (v_client.id, p_unit_id, v_user, 'bonus', v_bonus, 'signup', 'Bónus de registo')
  on conflict do nothing;

  return v_client;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. O cliente define como quer ser tratado
-- ---------------------------------------------------------------------
-- Só o nome. O `public_slug` fica intocado de propósito: é o que está no QR e
-- nos links já partilhados, e mudá-lo partia cartões que já andam por aí.

create or replace function public.loyalty_set_display_name(p_name text)
returns public.clients
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_client public.clients;
begin
  if v_user is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  if v_name = '' then
    raise exception 'indique como quer ser tratado' using errcode = '22023';
  end if;

  if length(v_name) > 60 then
    raise exception 'nome demasiado longo' using errcode = '22023';
  end if;

  update public.clients
  set name = v_name, name_confirmed = true
  where auth_user_id = v_user
  returning * into v_client;

  if v_client.id is null then
    raise exception 'conta sem cartão associado' using errcode = '42501';
  end if;

  return v_client;
end;
$$;

grant execute on function public.loyalty_set_display_name(text) to authenticated;
