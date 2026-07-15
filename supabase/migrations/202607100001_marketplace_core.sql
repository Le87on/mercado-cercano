-- A la Vuelta marketplace core schema.
-- Staging only. Apply to a Supabase project after reviewing in SQL editor.
-- Never use service-role credentials in the frontend.

create extension if not exists pgcrypto;

create type public.user_role as enum ('customer', 'business_owner', 'admin');
create type public.business_status as enum ('pending', 'verified', 'rejected', 'suspended');
create type public.order_status as enum ('pending_payment', 'payment_rejected', 'submitted', 'accepted', 'rejected', 'ready_for_pickup', 'in_delivery', 'closed', 'cancelled');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role public.user_role not null default 'customer',
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  category text not null,
  description text,
  city text not null,
  zone text,
  address text,
  phone text,
  email text,
  tax_id text,
  status public.business_status not null default 'pending',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_name_len check (char_length(name) >= 2)
);

create table if not exists public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  sku text,
  name text not null,
  description text,
  category text not null default 'General',
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, sku)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  status public.order_status not null default 'submitted',
  mode text not null check (mode in ('pickup', 'delivery')),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total numeric(12,2) not null check (total >= 0),
  notes text,
  pickup_qr_token text,
  delivery_pin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  product_name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.owns_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_members bm
    where bm.business_id = target_business_id and bm.user_id = auth.uid()
  ) or exists (
    select 1 from public.businesses b
    where b.id = target_business_id and b.owner_id = auth.uid()
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
create trigger businesses_touch_updated_at before update on public.businesses for each row execute function public.touch_updated_at();
create trigger products_touch_updated_at before update on public.products for each row execute function public.touch_updated_at();
create trigger orders_touch_updated_at before update on public.orders for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.admin_action_logs enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update_own_non_admin" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role <> 'admin');

create policy "businesses_public_verified_select" on public.businesses for select using (status = 'verified' and is_active = true or public.owns_business(id) or public.is_admin());
create policy "businesses_insert_owner_pending" on public.businesses for insert with check (owner_id = auth.uid() and status = 'pending');
create policy "businesses_owner_update_no_self_verify" on public.businesses for update using (public.owns_business(id)) with check (public.owns_business(id) and status in ('pending','rejected') and owner_id = auth.uid());
create policy "businesses_admin_update" on public.businesses for update using (public.is_admin()) with check (public.is_admin());

create policy "business_members_select_own_or_admin" on public.business_members for select using (user_id = auth.uid() or public.owns_business(business_id) or public.is_admin());
create policy "business_members_insert_admin" on public.business_members for insert with check (public.is_admin());
create policy "business_members_delete_admin" on public.business_members for delete using (public.is_admin());

create policy "products_select_active_or_owner" on public.products for select using (is_active = true or public.owns_business(business_id) or public.is_admin());
create policy "products_insert_owner_only" on public.products for insert with check (public.owns_business(business_id));
create policy "products_update_owner_only" on public.products for update using (public.owns_business(business_id)) with check (public.owns_business(business_id));
create policy "products_delete_owner_only" on public.products for delete using (public.owns_business(business_id));
create policy "products_admin_all" on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "orders_select_customer_owner_admin" on public.orders for select using (user_id = auth.uid() or public.owns_business(business_id) or public.is_admin());
create policy "orders_insert_customer" on public.orders for insert with check (user_id = auth.uid());
create policy "orders_update_business_owner" on public.orders for update using (public.owns_business(business_id) or public.is_admin()) with check (public.owns_business(business_id) or public.is_admin());

create policy "order_items_select_via_order" on public.order_items for select using (
  exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.owns_business(o.business_id) or public.is_admin()))
);
create policy "order_items_insert_customer_order" on public.order_items for insert with check (
  exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid() and o.business_id = business_id)
);

create policy "admin_logs_admin_only" on public.admin_action_logs for all using (public.is_admin()) with check (public.is_admin());
