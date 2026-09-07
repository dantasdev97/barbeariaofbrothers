-- 0014_client_phone.sql
-- O cliente autenticado passa a poder acrescentar ou corrigir o seu telefone.
--
-- Porquê uma função e não uma policy de UPDATE: a 0007 só dá ao cliente
-- leitura da própria linha (`self_read_own_client`). Abrir a linha inteira à
-- escrita deixaria o cliente mexer no `unit_id`, no `name`, no `qr_token` —
-- tudo o que decide a que barbearia pertence e que cartão é. Como no
-- `loyalty_set_display_name` da 0012, quem escreve é uma função
-- `security definer` que toca numa coluna só, e só no cartão de quem a chama.
--
-- Idempotente: pode correr duas vezes sem efeito diferente.

create or replace function public.loyalty_set_phone(p_phone text)
returns public.clients
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_client public.clients;
begin
  if v_user is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  -- Formato canónico: +351 seguido de 9 dígitos começados por 2 (fixo),
  -- 3 (VoIP) ou 9 (móvel). A aplicação já normaliza antes de chamar; isto é
  -- a segunda barreira, para o formato ser garantido mesmo que a função seja
  -- chamada de outro sítio.
  --
  -- Um formato único não é preciosismo: `clients.phone` tem índice único
  -- desde a 0004, e "912345678" e "+351912345678" são o mesmo número que o
  -- índice deixaria entrar duas vezes.
  if v_phone is not null and v_phone !~ '^\+351[239]\d{8}$' then
    raise exception 'telefone inválido' using errcode = '22023';
  end if;

  update public.clients
  set phone = v_phone
  where auth_user_id = v_user
  returning * into v_client;

  if v_client.id is null then
    raise exception 'conta sem cartão associado' using errcode = '42501';
  end if;

  return v_client;

exception
  -- O número já está noutro cartão. Sem isto, o cliente via a mensagem crua
  -- do Postgres com o nome do índice.
  when unique_violation then
    raise exception 'telefone já associado' using errcode = '23505';
end;
$$;

grant execute on function public.loyalty_set_phone(text) to authenticated;
