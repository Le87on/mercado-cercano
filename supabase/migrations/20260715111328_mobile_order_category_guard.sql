create or replace function private.enforce_market_order_store_active()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.market_stores s
    join public.market_categories c on c.id = s.category_id
    where s.id = new.store_id and s.active and c.active
  ) then
    raise exception 'Store or category is unavailable';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_market_order_store_active() from public, anon, authenticated;

create trigger enforce_market_order_store_active_before_insert
before insert on public.market_orders
for each row execute function private.enforce_market_order_store_active();
