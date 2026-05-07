-- =====================================================================
-- Seed data — Barbearia Of Brothers (Leiria, PT).
-- Aplicar via Supabase Dashboard → SQL editor (recomendado), ou via
--   npx supabase db reset    (se usar Supabase local).
-- =====================================================================

insert into public.units (slug, name, address, whatsapp, phone, buk_url, hours, socials, seo, active)
values
  (
    'brothers-1',
    'Barbearia Of Brothers — Leiria Centro',
    'Av. Nossa Senhora de Fátima 46, 2410-140 Leiria',
    null,
    null,
    'https://buk.pt/barbearia-of-brothers',
    jsonb_build_object(
      'mon', jsonb_build_object('open','09:00','close','19:00'),
      'tue', jsonb_build_object('open','09:00','close','19:00'),
      'wed', jsonb_build_object('open','09:00','close','19:00'),
      'thu', jsonb_build_object('open','09:00','close','19:00'),
      'fri', jsonb_build_object('open','09:00','close','20:00'),
      'sat', jsonb_build_object('open','09:00','close','18:00')
    ),
    jsonb_build_object(
      'instagram','https://instagram.com/barbeariaofbrothers'
    ),
    jsonb_build_object(
      'title','Barbearia Of Brothers — Leiria Centro',
      'description','Corte, barba e estilo desde 2012 — Av. Nossa Senhora de Fátima 46, Leiria.'
    ),
    true
  ),
  (
    'brothers-2',
    'Barbearia Of Brothers — Vale de Lobos',
    'R. Vale de Lobos 33 Loja A, 2410-078 Leiria',
    null,
    null,
    'https://barbeariaofbrothers2.buk.pt/',
    jsonb_build_object(
      'mon', jsonb_build_object('open','09:00','close','19:00'),
      'tue', jsonb_build_object('open','09:00','close','19:00'),
      'wed', jsonb_build_object('open','09:00','close','19:00'),
      'thu', jsonb_build_object('open','09:00','close','19:00'),
      'fri', jsonb_build_object('open','09:00','close','20:00'),
      'sat', jsonb_build_object('open','09:00','close','18:00')
    ),
    jsonb_build_object(
      'instagram','https://instagram.com/barbeariaofbrothers'
    ),
    jsonb_build_object(
      'title','Barbearia Of Brothers — Vale de Lobos',
      'description','Corte, barba e estilo desde 2012 — R. Vale de Lobos 33 Loja A, Leiria.'
    ),
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  address = excluded.address,
  buk_url = excluded.buk_url,
  hours = excluded.hours,
  socials = excluded.socials,
  seo = excluded.seo,
  active = excluded.active;

-- Sample categories + barbers + products for Brothers 1
do $$
declare
  u1 uuid;
begin
  select id into u1 from public.units where slug = 'brothers-1';
  if u1 is null then return; end if;

  insert into public.product_categories (unit_id, name, slug, display_order)
  values
    (u1, 'Cabelo', 'cabelo', 1),
    (u1, 'Barba', 'barba', 2)
  on conflict (unit_id, slug) do nothing;

  insert into public.barbers (unit_id, slug, name, speciality, description, display_order, active)
  values
    (u1, 'joao', 'João Silva', 'Corte clássico & navalha', 'Mais de 10 anos de experiência.', 1, true),
    (u1, 'pedro', 'Pedro Santos', 'Fade & desenhos', 'Especialista em cortes modernos.', 2, true)
  on conflict (unit_id, slug) do nothing;

  insert into public.products (unit_id, slug, name, description, price_cents, active)
  values
    (u1, 'pomada-classica', 'Pomada Clássica', 'Fixação forte, brilho médio.', 1500, true),
    (u1, 'oleo-barba', 'Óleo de Barba', 'Hidratação e aroma amadeirado.', 1800, true)
  on conflict (unit_id, slug) do nothing;
end $$;
