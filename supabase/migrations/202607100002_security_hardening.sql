-- A la Vuelta security hardening.
-- Apply after 202607100001_marketplace_core.sql.
-- New migration only: do not edit historical migrations.

-- 1) Profiles: prevent self role escalation.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.prevent_profile_role_self_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and not public.is_admin() then
    raise exception 'Only admins can change profile roles';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_self_change on public.profiles;
create trigger profiles_prevent_role_self_change
before update on public.profiles
for each row execute function public.prevent_profile_role_self_change();

drop policy if exists "profiles_update_own_non_admin" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_update_own_safe_fields" on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid() and role = public.current_user_role());
create policy "profiles_admin_update" on public.profiles
for update
using (public.is_admin())
with check (public.is_admin());

-- 2) Public business catalogue: expose only non-sensitive business card fields.
drop policy if exists "businesses_public_verified_select" on public.businesses;
drop policy if exists "businesses_select_owner_or_admin" on public.businesses;
create policy "businesses_select_owner_or_admin" on public.businesses
for select
using (public.owns_business(id) or public.is_admin());

create or replace view public.public_business_cards as
select
  b.id,
  b.name,
  b.category,
  b.description,
  b.city,
  b.zone,
  b.status,
  b.is_active,
  b.created_at
from public.businesses b
where b.status = 'verified' and b.is_active = true;

grant select on public.public_business_cards to anon, authenticated;

-- 3) Products: public catalogue only from verified/active businesses.
drop policy if exists "products_select_active_or_owner" on public.products;
drop policy if exists "products_select_published_or_owner" on public.products;
create policy "products_select_published_or_owner" on public.products
for select
using (
  public.owns_business(business_id)
  or public.is_admin()
  or (
    is_active = true
    and exists (
      select 1 from public.businesses b
      where b.id = business_id
        and b.status = 'verified'
        and b.is_active = true
    )
  )
);

-- 4) Order item integrity: product must belong to same business and totals must match.
create or replace function public.validate_order_item_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  product_row public.products%rowtype;
begin
  select * into product_row from public.products where id = new.product_id;
  if not found then
    raise exception 'Product does not exist';
  end if;
  if product_row.business_id <> new.business_id then
    raise exception 'Product does not belong to order business';
  end if;
  if new.quantity <= 0 then
    raise exception 'Invalid quantity';
  end if;
  if new.unit_price <> product_row.price then
    raise exception 'Unit price mismatch';
  end if;
  if new.quantity > product_row.stock then
    raise exception 'Insufficient stock';
  end if;
  if new.line_total <> new.unit_price * new.quantity then
    raise exception 'Line total mismatch';
  end if;
  new.product_name = product_row.name;
  return new;
end;
$$;

drop trigger if exists order_items_validate_integrity on public.order_items;
create trigger order_items_validate_integrity
before insert or update on public.order_items
for each row execute function public.validate_order_item_integrity();

-- 5) Order totals: keep order total coherent with declared subtotal + delivery fee.
create or replace function public.validate_order_totals()
returns trigger
language plpgsql
as $$
begin
  if new.total <> new.subtotal + new.delivery_fee then
    raise exception 'Order total mismatch';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_validate_totals on public.orders;
create trigger orders_validate_totals
before insert or update on public.orders
for each row execute function public.validate_order_totals();

-- 6) Order status transitions.
create or replace function public.validate_order_status_transition()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    return new;
  end if;

  if old.status = new.status then
    return new;
  end if;

  if old.status in ('payment_rejected', 'rejected', 'closed', 'cancelled') then
    raise exception 'Terminal order status cannot be changed';
  end if;

  if old.status = 'submitted' and new.status not in ('accepted', 'rejected', 'cancelled') then
    raise exception 'Invalid submitted transition';
  end if;

  if old.status = 'accepted' and new.status not in ('ready_for_pickup', 'in_delivery', 'cancelled') then
    raise exception 'Invalid accepted transition';
  end if;

  if old.status = 'ready_for_pickup' and new.status not in ('closed', 'cancelled') then
    raise exception 'Invalid pickup transition';
  end if;

  if old.status = 'in_delivery' and new.status not in ('closed', 'cancelled') then
    raise exception 'Invalid delivery transition';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_validate_status_transition on public.orders;
create trigger orders_validate_status_transition
before update on public.orders
for each row execute function public.validate_order_status_transition();

-- 7) Basic order event log for auditing.
create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  old_status public.order_status,
  new_status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.order_events enable row level security;

drop policy if exists "order_events_select_related" on public.order_events;
create policy "order_events_select_related" on public.order_events
for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or public.owns_business(o.business_id) or public.is_admin())
  )
);

drop policy if exists "order_events_insert_related" on public.order_events;
create policy "order_events_insert_related" on public.order_events
for insert
with check (
  actor_id = auth.uid()
  and exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or public.owns_business(o.business_id) or public.is_admin())
  )
);

create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.order_events(order_id, actor_id, old_status, new_status)
    values (new.id, auth.uid(), case when tg_op = 'INSERT' then null else old.status end, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists orders_log_status_change on public.orders;
create trigger orders_log_status_change
after insert or update on public.orders
for each row execute function public.log_order_status_change();
