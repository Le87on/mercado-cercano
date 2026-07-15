drop policy if exists "available products are public" on public.market_products;
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

create or replace function public.create_order(target_store_id uuid, delivery_address text, items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_order_id uuid;
  calculated_total numeric(12,2) := 0;
  requested_count integer;
  unique_count integer;
  matched_count integer := 0;
  locked_product record;
  validated_items jsonb := '[]'::jsonb;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(trim(delivery_address)) not between 3 and 300 then raise exception 'Invalid delivery address'; end if;
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) < 1 or jsonb_array_length(items) > 50 then
    raise exception 'Invalid order items';
  end if;
  if not exists (
    select 1
    from public.market_stores s
    join public.market_categories c on c.id = s.category_id
    where s.id = target_store_id and s.active and c.active
  ) then
    raise exception 'Store is unavailable';
  end if;

  requested_count := jsonb_array_length(items);
  select count(*) into unique_count
  from (
    select item.product_id
    from jsonb_to_recordset(items) as item(product_id uuid, quantity integer)
    where item.quantity between 1 and 99
    group by item.product_id
  ) unique_items;
  if unique_count <> requested_count then raise exception 'Invalid or duplicate product'; end if;

  for locked_product in
    select p.id, p.store_id, p.name, p.price, p.stock, p.available, item.quantity
    from jsonb_to_recordset(items) as item(product_id uuid, quantity integer)
    join public.market_products p on p.id = item.product_id
    order by p.id
    for update of p
  loop
    if locked_product.store_id <> target_store_id or not locked_product.available or locked_product.stock < locked_product.quantity then
      raise exception 'Product unavailable or insufficient stock';
    end if;
    matched_count := matched_count + 1;
    calculated_total := calculated_total + (locked_product.price * locked_product.quantity);
    validated_items := validated_items || jsonb_build_array(jsonb_build_object(
      'product_id', locked_product.id,
      'name', locked_product.name,
      'unit_price', locked_product.price,
      'quantity', locked_product.quantity
    ));
  end loop;
  if matched_count <> requested_count then raise exception 'Product unavailable or insufficient stock'; end if;

  insert into public.market_orders (customer_id, store_id, delivery_address, total)
  values (current_user_id, target_store_id, trim(delivery_address), calculated_total)
  returning id into new_order_id;

  insert into public.market_order_items (order_id, product_id, product_name, unit_price, quantity)
  select new_order_id, item.product_id, item.name, item.unit_price, item.quantity
  from jsonb_to_recordset(validated_items) as item(
    product_id uuid,
    name text,
    unit_price numeric,
    quantity integer
  );

  update public.market_products p
  set stock = p.stock - item.quantity, updated_at = now()
  from jsonb_to_recordset(validated_items) as item(product_id uuid, quantity integer)
  where p.id = item.product_id;

  insert into public.market_order_events (order_id, actor_id, status)
  values (new_order_id, current_user_id, 'submitted');
  return new_order_id;
end;
$$;

revoke all on function public.create_order(uuid, text, jsonb) from public, anon;
grant execute on function public.create_order(uuid, text, jsonb) to authenticated;
