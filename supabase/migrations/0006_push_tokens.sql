-- 0006_push_tokens.sql
-- Suporte a push notifications na app nativa (Capacitor).
-- Guarda o token do dispositivo no perfil. A escrita é feita por uma RPC
-- SECURITY DEFINER (save_push_token) para não precisar de uma policy de UPDATE
-- aberta em profiles, que permitiria escalada de role.

alter table public.profiles
  add column if not exists push_token text,
  add column if not exists push_platform text
    check (push_platform is null or push_platform in ('ios', 'android'));

-- RPC: utilizador autenticado grava o seu próprio token (apenas estas colunas).
create or replace function public.save_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if p_platform is not null and p_platform not in ('ios', 'android') then
    raise exception 'invalid platform' using errcode = '22023';
  end if;

  update public.profiles
     set push_token = p_token,
         push_platform = p_platform
   where id = auth.uid();
end;
$$;

revoke all on function public.save_push_token(text, text) from public;
grant execute on function public.save_push_token(text, text) to authenticated;

notify pgrst, 'reload schema';
