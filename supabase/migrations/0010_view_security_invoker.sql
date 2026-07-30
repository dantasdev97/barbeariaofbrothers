-- 0010_view_security_invoker.sql
-- A view client_unit_balances ignorava a RLS.
--
-- Em Postgres uma view corre, por omissão, com os privilégios do **dono** e não
-- de quem a consulta, pelo que as policies de loyalty_transactions não se
-- aplicavam. Como o Supabase concede acesso ao schema public a `anon` e
-- `authenticated` por omissão, qualquer pessoa com a chave anónima — que é
-- pública, vai no bundle do browser — conseguia ler o saldo de todos os
-- clientes de todas as unidades.
--
-- Com security_invoker a view passa a correr com os privilégios de quem
-- consulta, e a policy scope_unit_transactions (0009) volta a valer.
--
-- Não afeta a aplicação: os dois sítios que lêem a view
-- (src/lib/loyalty/queries.ts e src/app/cliente/[handle]/page.tsx) usam o
-- service role, que continua a passar à frente da RLS.
--
-- Requer Postgres 15+.

alter view public.client_unit_balances set (security_invoker = true);
