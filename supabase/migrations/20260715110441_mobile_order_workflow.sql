drop policy if exists "store members update orders" on public.market_orders;
revoke update (status) on public.market_orders from authenticated;

grant update (name, description, price, stock, image_url, available) on public.market_products to authenticated;
create policy "store members update products" on public.market_products
for update to authenticated
using ((select private.is_market_store_member(store_id)))
with check ((select private.is_market_store_member(store_id)));

create or replace function public.update_market_order_status(
  target_order_id uuid,
  next_status public.market_order_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status public.market_order_status;
  target_store_id uuid;
begin
  select status, store_id
  into current_status, target_store_id
  from public.market_orders
  where id = target_order_id
  for update;

  if current_status is null then raise exception 'Order not found'; end if;
  if not private.is_market_store_member(target_store_id) then raise exception 'Store membership required'; end if;

  if not (
    (current_status = 'submitted' and next_status in ('accepted', 'rejected')) or
    (current_status = 'accepted' and next_status in ('preparing', 'cancelled')) or
    (current_status = 'preparing' and next_status = 'ready') or
    (current_status = 'ready' and next_status = 'completed')
  ) then
    raise exception 'Invalid order status transition';
  end if;

  update public.market_orders
  set status = next_status, updated_at = now()
  where id = target_order_id;

  insert into public.market_order_events (order_id, actor_id, status)
  values (target_order_id, auth.uid(), next_status);
end;
$$;

revoke all on function public.update_market_order_status(uuid, public.market_order_status) from public, anon;
grant execute on function public.update_market_order_status(uuid, public.market_order_status) to authenticated;
