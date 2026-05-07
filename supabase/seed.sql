-- =====================================================================
-- Seed data — 2 unidades iniciais.
-- Atualize os WhatsApp / endereços / Buk URLs conforme os reais.
-- Aplicar com:  npx supabase db reset    (local) ou via dashboard SQL editor.
-- =====================================================================

insert into public.units (slug, name, address, whatsapp, phone, buk_url, hours, socials, seo, active)
values
  (
    'unidade-1',
    'Barbearia Of Brothers — Unidade 1',
    'Rua Exemplo 1, Lisboa',
    '351900000001',
    '+351 900 000 001',
    'https://buk.pt/barbeariaofbrothers-1',
    jsonb_build_object(
      'mon', jsonb_build_object('open','09:00','close','19:00'),
      'tue', jsonb_build_object('open','09:00','close','19:00'),
      'wed', jsonb_build_object('open','09:00','close','19:00'),
      'thu', jsonb_build_object('open','09:00','close','19:00'),
      'fri', jsonb_build_object('open','09:00','close','20:00'),
      'sat', jsonb_build_object('open','09:00','close','18:00')
    ),
    jsonb_build_object(
      'instagram','https://instagram.com/barbeariaofbrothers',
      'facebook','https://facebook.com/barbeariaofbrothers'
    ),
    jsonb_build_object(
      'title','Barbearia Of Brothers — Unidade 1',
      'description','Corte, barba e estilo desde 2012 — Unidade 1.'
    ),
    true
  ),
  (
    'unidade-2',
    'Barbearia Of Brothers — Unidade 2',
    'Rua Exemplo 2, Porto',
    '351900000002',
    '+351 900 000 002',
    'https://buk.pt/barbeariaofbrothers-2',
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
      'title','Barbearia Of Brothers — Unidade 2',
      'description','Corte, barba e estilo desde 2012 — Unidade 2.'
    ),
    true
  )
on conflict (slug) do nothing;

-- Sample categories + barbers + products for Unidade 1
do $$
declare
  u1 uuid;
  c_cabelo uuid;
  c_barba uuid;
begin
  select id into u1 from public.units where slug = 'unidade-1';
  if u1 is null then return; end if;

  insert into public.product_categories (unit_id, name, slug, display_order)
  values (u1, 'Cabelo', 'cabelo', 1)
  on conflict do nothing
  returning id into c_cabelo;

  insert into public.product_categories (unit_id, name, slug, display_order)
  values (u1, 'Barba', 'barba', 2)
  on conflict do nothing
  returning id into c_barba;

  insert into public.barbers (unit_id, slug, name, speciality, description, display_order, active)
  values
    (u1, 'joao', 'João Silva', 'Corte clássico & navalha', 'Mais de 10 anos de experiência.', 1, true),
    (u1, 'pedro', 'Pedro Santos', 'Fade & desenhos', 'Especialista em cortes modernos.', 2, true)
  on conflict do nothing;

  insert into public.products (unit_id, slug, name, description, price_cents, active)
  values
    (u1, 'pomada-classica', 'Pomada Clássica', 'Fixação forte, brilho médio.', 1500, true),
    (u1, 'oleo-barba', 'Óleo de Barba', 'Hidratação e aroma amadeirado.', 1800, true)
  on conflict do nothing;
end $$;
