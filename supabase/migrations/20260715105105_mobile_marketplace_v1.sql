-- Mobile-first marketplace schema for A la Vuelta.
-- Names are intentionally prefixed to coexist with the legacy web prototype.

create schema if not exists private;

create type public.market_user_role as enum ('customer', 'merchant', 'admin');
create type public.market_member_role as enum ('owner', 'manager', 'staff');
create type public.market_order_status as enum ('submitted', 'accepted', 'preparing', 'ready', 'completed', 'rejected', 'cancelled');

create table public.market_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  role public.market_user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.market_categories (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null,
  icon text not null,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  description text not null default '',
  position integer not null default 0,
  active boolean not null default true
);

create table public.market_stores (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.market_categories(id),
  name text not null,
  city text not null,
  description text not null default '',
  rating numeric(2,1) not null default 0 check (rating between 0 and 5),
  eta text,
  delivery_label text,
  image_url text,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.market_store_members (
  store_id uuid not null references public.market_stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.market_member_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create table public.market_products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.market_stores(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.market_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id),
  store_id uuid not null references public.market_stores(id),
  status public.market_order_status not null default 'submitted',
  delivery_address text not null check (char_length(delivery_address) between 3 and 300),
  total numeric(12,2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.market_order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.market_orders(id) on delete cascade,
  product_id uuid not null references public.market_products(id),
  product_name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 99),
  unique (order_id, product_id)
);

create table public.market_order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.market_orders(id) on delete cascade,
  actor_id uuid references auth.users(id),
  status public.market_order_status not null,
  created_at timestamptz not null default now()
);

create index market_stores_category_idx on public.market_stores(category_id) where active;
create index market_products_store_idx on public.market_products(store_id) where available;
create index market_store_members_user_idx on public.market_store_members(user_id);
create index market_orders_customer_created_idx on public.market_orders(customer_id, created_at desc);
create index market_orders_store_created_idx on public.market_orders(store_id, created_at desc);
create index market_order_items_order_idx on public.market_order_items(order_id);
create index market_order_events_order_idx on public.market_order_events(order_id, created_at);

alter table public.market_profiles enable row level security;
alter table public.market_categories enable row level security;
alter table public.market_stores enable row level security;
alter table public.market_store_members enable row level security;
alter table public.market_products enable row level security;
alter table public.market_orders enable row level security;
alter table public.market_order_items enable row level security;
alter table public.market_order_events enable row level security;

revoke all on public.market_profiles, public.market_categories, public.market_stores,
  public.market_store_members, public.market_products, public.market_orders,
  public.market_order_items, public.market_order_events from anon, authenticated;
grant select on public.market_categories, public.market_stores, public.market_products to anon, authenticated;
grant select, insert on public.market_profiles to authenticated;
grant update (display_name, phone) on public.market_profiles to authenticated;
grant select on public.market_store_members, public.market_orders, public.market_order_items, public.market_order_events to authenticated;
grant update (status) on public.market_orders to authenticated;

create policy "active categories are public" on public.market_categories for select to anon, authenticated using (active);
create policy "active stores are public" on public.market_stores for select to anon, authenticated using (active);
create policy "available products are public" on public.market_products for select to anon, authenticated using (available and stock > 0);
create policy "users read own profile" on public.market_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "users create own profile" on public.market_profiles for insert to authenticated with check ((select auth.uid()) = user_id and role = 'customer');
create policy "users update own profile" on public.market_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "members read own memberships" on public.market_store_members for select to authenticated using ((select auth.uid()) = user_id);

create or replace function private.is_market_store_member(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.market_store_members
    where store_id = target_store_id and user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_market_store_member(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_market_store_member(uuid) to authenticated;

create policy "customers and stores read orders" on public.market_orders for select to authenticated
using ((select auth.uid()) = customer_id or (select private.is_market_store_member(store_id)));
create policy "store members update orders" on public.market_orders for update to authenticated
using ((select private.is_market_store_member(store_id)))
with check ((select private.is_market_store_member(store_id)));
create policy "order participants read items" on public.market_order_items for select to authenticated
using (exists (
  select 1 from public.market_orders o
  where o.id = order_id and (o.customer_id = (select auth.uid()) or (select private.is_market_store_member(o.store_id)))
));
create policy "order participants read events" on public.market_order_events for select to authenticated
using (exists (
  select 1 from public.market_orders o
  where o.id = order_id and (o.customer_id = (select auth.uid()) or (select private.is_market_store_member(o.store_id)))
));

create or replace function private.create_market_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.market_profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)))
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.create_market_profile() from public, anon, authenticated;

create trigger create_market_profile_after_signup
after insert on auth.users
for each row execute function private.create_market_profile();

create or replace function public.create_order(target_store_id uuid, delivery_address text, items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_order_id uuid;
  calculated_total numeric(12,2);
  requested_count integer;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) < 1 or jsonb_array_length(items) > 50 then
    raise exception 'Invalid order items';
  end if;
  if not exists (select 1 from public.market_stores where id = target_store_id and active) then
    raise exception 'Store is unavailable';
  end if;

  with requested as (
    select product_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(items) as item(product_id uuid, quantity integer)
    group by product_id
  )
  select count(*) into requested_count from requested where quantity between 1 and 99;

  if requested_count <> jsonb_array_length(items) then raise exception 'Invalid or duplicate product'; end if;

  with requested as (
    select product_id, quantity
    from jsonb_to_recordset(items) as item(product_id uuid, quantity integer)
  )
  select sum(p.price * r.quantity) into calculated_total
  from requested r
  join public.market_products p on p.id = r.product_id
  where p.store_id = target_store_id and p.available and p.stock >= r.quantity;

  if calculated_total is null or (
    select count(*) from jsonb_to_recordset(items) as item(product_id uuid, quantity integer)
  ) <> (
    select count(*) from jsonb_to_recordset(items) as item(product_id uuid, quantity integer)
    join public.market_products p on p.id = item.product_id
    where p.store_id = target_store_id and p.available and p.stock >= item.quantity
  ) then raise exception 'Product unavailable or insufficient stock'; end if;

  insert into public.market_orders (customer_id, store_id, delivery_address, total)
  values (current_user_id, target_store_id, delivery_address, calculated_total)
  returning id into new_order_id;

  insert into public.market_order_items (order_id, product_id, product_name, unit_price, quantity)
  select new_order_id, p.id, p.name, p.price, item.quantity
  from jsonb_to_recordset(items) as item(product_id uuid, quantity integer)
  join public.market_products p on p.id = item.product_id and p.store_id = target_store_id;

  update public.market_products p
  set stock = p.stock - item.quantity, updated_at = now()
  from jsonb_to_recordset(items) as item(product_id uuid, quantity integer)
  where p.id = item.product_id;

  insert into public.market_order_events (order_id, actor_id, status)
  values (new_order_id, current_user_id, 'submitted');

  return new_order_id;
end;
$$;
revoke all on function public.create_order(uuid, text, jsonb) from public, anon;
grant execute on function public.create_order(uuid, text, jsonb) to authenticated;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

insert into public.market_categories (id, name, icon, color, description, position) values
  ('gastronomia', 'Comida', 'restaurant-outline', '#F43F5E', 'Restaurantes y más', 1),
  ('almacen', 'Almacén', 'basket-outline', '#F59E0B', 'Despensa diaria', 2),
  ('salud', 'Farmacia', 'medkit-outline', '#10B981', 'Salud y cuidado', 3),
  ('moda', 'Moda', 'shirt-outline', '#3B82F6', 'Ropa y calzado', 4),
  ('ferreteria', 'Ferretería', 'hammer-outline', '#F97316', 'Herramientas', 5),
  ('servicios', 'Servicios', 'construct-outline', '#8B5CF6', 'Técnicos cerca', 6);

insert into public.market_stores (id, category_id, name, city, description, rating, eta, delivery_label, image_url, featured) values
  ('11111111-1111-4111-8111-111111111111', 'gastronomia', 'Parientes Pizzería', 'San Carlos', 'Pizzas al horno y empanadas caseras.', 4.8, '25–35 min', 'Envío $1.200', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&auto=format&fit=crop', true),
  ('22222222-2222-4222-8222-222222222222', 'almacen', 'Mercado Sur', 'Eugenio Bustos', 'Almacén, bebidas y productos frescos.', 4.7, '20–30 min', 'Envío gratis', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&auto=format&fit=crop', false),
  ('33333333-3333-4333-8333-333333333333', 'salud', 'Farmacia Central', 'La Consulta', 'Cuidado personal y farmacia de cercanía.', 4.9, '15–25 min', 'Envío $900', 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=900&auto=format&fit=crop', false),
  ('44444444-4444-4444-8444-444444444444', 'moda', 'Calzados Sucre', 'Eugenio Bustos', 'Calzado urbano para toda la familia.', 4.7, 'Retiro', 'Coordinar entrega', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop', false),
  ('55555555-5555-4555-8555-555555555555', 'ferreteria', 'Ferretería El Tornillo', 'San Carlos', 'Herramientas y soluciones para el hogar.', 4.8, '20–30 min', 'Envío $1.200', 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=900&auto=format&fit=crop', false),
  ('66666666-6666-4666-8666-666666666666', 'servicios', 'Servicios del Valle', 'Tunuyán', 'Electricidad, climatización y reparaciones.', 4.9, 'Con turno', 'Visita a domicilio', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&auto=format&fit=crop', false);

insert into public.market_products (id, store_id, name, description, price, stock, image_url) values
  ('a1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Pizza muzzarella grande', 'Salsa casera, muzzarella y aceitunas', 6900, 18, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=700&auto=format&fit=crop'),
  ('a2222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Docena de empanadas', 'Carne, jamón y queso o verdura', 9800, 12, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=700&auto=format&fit=crop'),
  ('b1111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Leche entera 1 L', null, 1500, 30, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=700&auto=format&fit=crop'),
  ('b2222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'Café molido 500 g', null, 7200, 20, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=700&auto=format&fit=crop'),
  ('c1111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'Alcohol en gel 500 ml', null, 3900, 22, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=700&auto=format&fit=crop'),
  ('d1111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', 'Zapatillas urbanas', null, 38500, 8, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop'),
  ('e1111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555', 'Martillo de acero', null, 16400, 14, 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=700&auto=format&fit=crop'),
  ('f1111111-1111-4111-8111-111111111111', '66666666-6666-4666-8666-666666666666', 'Revisión de aire acondicionado', null, 28000, 6, 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=700&auto=format&fit=crop');
