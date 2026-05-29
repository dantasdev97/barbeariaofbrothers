-- =====================================================================
-- Slug público amigável para clientes
-- =====================================================================
-- Em vez do qr_token de 21 chars no URL, usar algo legível:
--   /cliente/augusto-dantas-J2VV
-- O qr_token continua a existir e é o que é codificado no QR Code físico.
-- Para o site, o lookup aceita slug OU token (compat).
-- =====================================================================

alter table public.clients
  add column if not exists public_slug text;

-- Helper: slugify simples (lowercase, sem acentos básicos, espaços→hifen)
create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(
        lower(
          translate(
            input,
            'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇñÑ',
            'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUCnN'
          )
        ),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
$$;

-- Backfill: nome-slug + 4 primeiros chars do qr_token
update public.clients
set public_slug = public.slugify(name) || '-' || substr(qr_token, 1, 4)
where public_slug is null;

-- Garantir unicidade (raro colidir; se acontecer, append +id8)
update public.clients
set public_slug = public_slug || '-' || substr(id::text, 1, 4)
where id in (
  select id from (
    select id, public_slug,
      row_number() over (partition by public_slug order by created_at) as rn
    from public.clients
  ) t
  where rn > 1
);

alter table public.clients
  alter column public_slug set not null;

create unique index if not exists clients_public_slug_uidx
  on public.clients (public_slug);
