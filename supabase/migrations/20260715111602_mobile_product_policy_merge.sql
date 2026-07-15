drop policy if exists "available products are public" on public.market_products;
drop policy if exists "store members read own products" on public.market_products;
drop policy if exists "products visible to signed in users" on public.market_products;

create policy "available products are public" on public.market_products
for select to anon
using (
  available and stock > 0 and exists (
    select 1
    from public.market_stores s
    join public.market_categories c on c.id = s.category_id
    where s.id = store_id and s.active and c.active
  )
);

create policy "products visible to signed in users" on public.market_products
for select to authenticated
using (
  (
    available and stock > 0 and exists (
      select 1
      from public.market_stores s
      join public.market_categories c on c.id = s.category_id
      where s.id = store_id and s.active and c.active
    )
  ) or (select private.is_market_store_member(store_id))
);
