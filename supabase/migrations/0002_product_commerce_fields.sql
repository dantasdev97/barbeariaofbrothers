-- Product commerce fields: discount (compare-at price), stock, out-of-stock, featured.
alter table public.products
  add column if not exists compare_at_price_cents int
    check (compare_at_price_cents is null or compare_at_price_cents >= 0),
  add column if not exists stock int not null default 0 check (stock >= 0),
  add column if not exists out_of_stock boolean not null default false,
  add column if not exists featured boolean not null default false;

create index if not exists products_featured_idx on public.products (unit_id, featured);
