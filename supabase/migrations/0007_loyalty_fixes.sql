-- 0007_loyalty_fixes.sql
-- Correções ao módulo de fidelidade, na sequência de não ser possível dar baixa
-- no cartão a partir da operação:
--   1. unidades sem serviços/recompensas configurados (a lista aparecia vazia)
--   2. o seed idempotente não tinha constraint em que encaixar o ON CONFLICT
--   3. o âmbito por unidade em loyalty_transactions não estava a ser imposto

-- ---------------------------------------------------------------------
-- 1. Unicidade por (unidade, nome)
-- ---------------------------------------------------------------------
-- O `on conflict do nothing` do seed (supabase/seed.sql) não tinha nenhuma
-- constraint aplicável, pelo que reexecutar o seed duplicava serviços e
-- recompensas. Limpar duplicados antes de criar o índice, mantendo o mais
-- antigo de cada (unit_id, name) e reapontando as transações que referem os
-- que vão desaparecer.

with ranked as (
  select id, unit_id, name,
    first_value(id) over (
      partition by unit_id, name order by created_at, id
    ) as keep_id
  from public.loyalty_services
)
update public.loyalty_transactions t
set service_id = r.keep_id
from ranked r
where t.service_id = r.id and r.id <> r.keep_id;

delete from public.loyalty_services s
where exists (
  select 1 from public.loyalty_services other
  where other.unit_id = s.unit_id
    and other.name = s.name
    and (other.created_at, other.id) < (s.created_at, s.id)
);

with ranked as (
  select id, unit_id, name,
    first_value(id) over (
      partition by unit_id, name order by created_at, id
    ) as keep_id
  from public.loyalty_rewards
)
update public.loyalty_transactions t
set reward_id = r.keep_id
from ranked r
where t.reward_id = r.id and r.id <> r.keep_id;

delete from public.loyalty_rewards s
where exists (
  select 1 from public.loyalty_rewards other
  where other.unit_id = s.unit_id
    and other.name = s.name
    and (other.created_at, other.id) < (s.created_at, s.id)
);

create unique index if not exists loyalty_services_unit_name_uidx
  on public.loyalty_services (unit_id, name);

create unique index if not exists loyalty_rewards_unit_name_uidx
  on public.loyalty_rewards (unit_id, name);

-- ---------------------------------------------------------------------
-- 2. Configuração base para unidades sem serviços
-- ---------------------------------------------------------------------
-- O seed só criou serviços para as unidades que existiam quando correu.
-- Qualquer unidade criada depois ficou sem nenhum serviço activo, e a operação
-- mostrava "Sem serviços configurados para esta unidade" sem forma de lançar
-- pontos. Preenche apenas as unidades que não têm nada — não mexe em
-- configuração já feita à mão.

do $$
declare
  u uuid;
begin
  for u in
    select id from public.units
    where not exists (
      select 1 from public.loyalty_services s
      where s.unit_id = units.id and s.active = true
    )
  loop
    insert into public.loyalty_services (unit_id, name, points_value, display_order, active)
    values
      (u, 'Corte',              10, 1, true),
      (u, 'Barba',               6, 2, true),
      (u, 'Corte + Barba',      15, 3, true),
      (u, 'Pigmentação',        12, 4, true),
      (u, 'Tratamento capilar',  8, 5, true)
    on conflict (unit_id, name) do nothing;
  end loop;

  for u in
    select id from public.units
    where not exists (
      select 1 from public.loyalty_rewards r
      where r.unit_id = units.id and r.active = true
    )
  loop
    insert into public.loyalty_rewards (unit_id, name, description, points_cost, active)
    values
      (u, 'Cera grátis',  'Aplicação de cera no final do serviço.',    100, true),
      (u, 'Barba grátis', 'Próxima barba por nossa conta.',            150, true),
      (u, 'Corte grátis', 'Próximo corte completo por nossa conta.',   250, true),
      (u, 'Combo grátis', 'Corte + barba grátis. Validade 30 dias.',   400, true)
    on conflict (unit_id, name) do nothing;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3. RLS de loyalty_transactions: impor o âmbito por unidade
-- ---------------------------------------------------------------------
-- 0004 criou duas policies permissive de SELECT: "staff_read_transactions"
-- (is_staff()) e "scope_unit_transactions" (super_admin ou unidade do perfil).
-- Policies permissive combinam com OR, pelo que a primeira tornava a segunda
-- irrelevante e qualquer staff lia as transações de todas as unidades —
-- exactamente o contrário do que o comentário dessa migração afirmava.
-- Fica só a que impõe o âmbito; já cobre super_admin.

drop policy if exists "staff_read_transactions" on public.loyalty_transactions;

drop policy if exists "scope_unit_transactions" on public.loyalty_transactions;
create policy "scope_unit_transactions"
  on public.loyalty_transactions for select
  using (
    public.is_staff()
    and (
      public.current_role() = 'super_admin'
      or unit_id = public.current_unit_id()
    )
  );
