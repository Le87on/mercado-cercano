create index market_order_items_product_idx on public.market_order_items(product_id);
create index market_order_events_actor_idx on public.market_order_events(actor_id) where actor_id is not null;
