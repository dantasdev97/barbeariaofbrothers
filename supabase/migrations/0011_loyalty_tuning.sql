-- 0011_loyalty_tuning.sql
-- Ajustes pedidos pelo dono depois do programa entrar em funcionamento:
--   1. bónus de registo passa de 50 para 10 pontos
--   2. bónus de Instagram passa de 30 para 15, e passa a exigir o @ do cliente
--   3. a Brothers 2 sai do cartão fidelidade sem sair do site público
--
-- Idempotente: pode correr duas vezes sem efeito diferente.

-- ---------------------------------------------------------------------
-- 1. Valores dos bónus
-- ---------------------------------------------------------------------
-- A tabela loyalty_bonuses (0008) foi semeada com 50/30. O painel já permite
-- editar, mas o pedido é que o valor de origem seja 10/15.

update public.loyalty_bonuses set points = 10 where kind = 'signup'    and points = 50;
update public.loyalty_bonuses set points = 15 where kind = 'instagram' and points = 30;

-- Garante linha para unidades criadas depois da 0008.
insert into public.loyalty_bonuses (unit_id, kind, points)
select id, 'signup', 10 from public.units
on conflict (unit_id, kind) do nothing;

insert into public.loyalty_bonuses (unit_id, kind, points)
select id, 'instagram', 15 from public.units
on conflict (unit_id, kind) do nothing;

-- E para as que vierem a ser criadas.
--
-- Sem isto, uma unidade nova nascia sem linhas de bónus e `loyalty_grant_bonus`
-- recusava o Instagram com "bónus indisponível para esta unidade" — o registo
-- escapava por ter `coalesce(v_bonus, 10)`, o Instagram não. Verificado: era
-- exactamente o que acontecia numa unidade criada depois desta migração.
create or replace function public.seed_unit_loyalty_bonuses()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.loyalty_bonuses (unit_id, kind, points)
  values (new.id, 'signup', 10), (new.id, 'instagram', 15)
  on conflict (unit_id, kind) do nothing;
  return new;
end;
$$;

drop trigger if exists units_seed_loyalty_bonuses on public.units;
create trigger units_seed_loyalty_bonuses
  after insert on public.units
  for each row execute function public.seed_unit_loyalty_bonuses();

-- ---------------------------------------------------------------------
-- 2. Fidelidade activa por unidade
-- ---------------------------------------------------------------------
-- A Brothers 2 continua no site público — tem página, barbeiros e produtos.
-- O que sai é a oferta dela no cartão fidelidade, e isso é um interruptor
-- que o dono liga sozinho no painel quando a quiser incluir.

alter table public.units
  add column if not exists loyalty_active boolean not null default true;

update public.units set loyalty_active = false where slug = 'brothers-2';

-- ---------------------------------------------------------------------
-- 3. @ de Instagram do cliente
-- ---------------------------------------------------------------------
-- Até aqui o bónus de Instagram era um clique sem verificação nenhuma:
-- qualquer pessoa levava os pontos sem seguir. Passa a pedir o @, que fica
-- guardado para o dono poder conferir.

alter table public.clients
  add column if not exists instagram_handle text;

-- ---------------------------------------------------------------------
-- 4. loyalty_grant_bonus com handle
-- ---------------------------------------------------------------------
-- Acrescentar um parâmetro não pode ser feito com `create or replace`: criava
-- uma sobrecarga e as chamadas de 2 argumentos ficavam ambíguas. É preciso
-- largar a versão antiga primeiro e voltar a dar o grant no fim.

drop function if exists public.loyalty_grant_bonus(text, uuid);

create or replace function public.loyalty_grant_bonus(
  p_kind    text,
  p_unit_id uuid,
  p_handle  text default null
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
  v_handle text;
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

  -- O @ é obrigatório no Instagram. Normaliza aqui também e não só no
  -- browser: o cliente da app não é o único caminho até esta função.
  if p_kind = 'instagram' then
    v_handle := lower(btrim(regexp_replace(coalesce(p_handle, ''), '^@+', '')));
    if v_handle = '' then
      raise exception 'indique o seu nome de Instagram' using errcode = '22023';
    end if;
    if v_handle !~ '^[a-z0-9._]{1,30}$' then
      raise exception 'nome de Instagram inválido' using errcode = '22023';
    end if;
  end if;

  if exists (
    select 1 from public.loyalty_transactions
    where client_id = v_client_id and bonus_kind = p_kind
  ) then
    raise exception 'bónus já atribuído' using errcode = '23505';
  end if;

  -- Grava o handle na mesma transacção dos pontos: não pode haver bónus de
  -- Instagram atribuído sem ficar registado a quem pertence.
  if v_handle is not null then
    update public.clients set instagram_handle = v_handle where id = v_client_id;
  end if;

  insert into public.loyalty_transactions
    (client_id, unit_id, actor_user_id, type, points, bonus_kind, note)
  values
    (v_client_id, p_unit_id, v_user, 'bonus', v_points, p_kind,
     case p_kind
       when 'signup' then 'Bónus de registo'
       when 'instagram' then 'Seguiu no Instagram: @' || v_handle
     end)
  returning * into v_tx;

  return v_tx;
end;
$$;

grant execute on function public.loyalty_grant_bonus(text, uuid, text) to authenticated;
