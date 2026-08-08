-- 0013_loyalty_active_repair.sql
-- Repara o que a 0011 tentou fazer e não fez.
--
-- A 0011 tirava a segunda barbearia do cartão fidelidade assim:
--
--   update public.units set loyalty_active = false where slug = 'brothers-2';
--
-- Esse slug vem do `seed.sql`. Em produção os slugs são outros, o `update`
-- não apanhou linha nenhuma — e um `update` que não apanha linhas não dá
-- erro. A migração passou a verde com as duas unidades ainda no programa.
--
-- A consequência não ficava na base: `getLoyaltyUnits()` devolvia duas
-- unidades, o `/minha-conta` deixava de conseguir decidir sozinho qual era a
-- barbearia, e quem acabava de criar conta aterrava no ecrã "Falta só
-- escolher a barbearia" em vez de no cartão.
--
-- Aqui a regra deixa de depender de um slug escrito à mão: fica no programa
-- a unidade mais antiga (a mesma ordem por que `getLoyaltyUnits()` as
-- devolve), as outras saem.
--
-- Idempotente, e com guarda: só actua enquanto **todas** as unidades activas
-- estiverem ligadas ao programa, ou seja, enquanto ninguém tiver configurado
-- nada. Assim que o dono desligar (ou voltar a ligar) uma unidade no painel,
-- esta migração passa a não tocar em nada — a escolha dele ganha sempre.

do $$
declare
  v_active     int;
  v_configured int;
  v_keep       uuid;
  v_removed    int;
begin
  select count(*) into v_active
  from public.units where active;

  select count(*) into v_configured
  from public.units where active and not loyalty_active;

  if v_active < 2 then
    raise notice '[0013] % unidade(s) activa(s) — nada a decidir.', v_active;
    return;
  end if;

  if v_configured > 0 then
    raise notice '[0013] fidelidade já configurada à mão (% fora do programa) — não mexer.', v_configured;
    return;
  end if;

  select id into v_keep
  from public.units
  where active
  order by created_at asc
  limit 1;

  update public.units
  set loyalty_active = false
  where active and id <> v_keep;

  get diagnostics v_removed = row_count;
  raise notice '[0013] unidades retiradas do programa de fidelidade: %', v_removed;
end $$;
