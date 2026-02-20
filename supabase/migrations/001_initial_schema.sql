-- REYNA Initial Schema
-- Führe dieses SQL in Supabase Dashboard -> SQL Editor aus

-- Profiles (erweitert auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  role text check (role in ('gastronom', 'lieferant')),
  company_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger: Profil bei neuer User-Registrierung anlegen
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Suppliers
create table if not exists public.suppliers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  company_name text not null,
  address text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.suppliers enable row level security;

create policy "Anyone can view suppliers"
  on public.suppliers for select
  using (true);

create policy "Suppliers can manage own"
  on public.suppliers for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'lieferant'
    )
    and user_id = auth.uid()
  );

create policy "Suppliers can insert own"
  on public.suppliers for insert
  with check (user_id = auth.uid());

-- Products
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  supplier_id uuid references public.suppliers(id) on delete cascade not null,
  name text not null,
  description text,
  price integer not null check (price >= 0),
  unit text not null default 'Stück',
  category text,
  image_url text,
  is_available boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "Anyone can view available products"
  on public.products for select
  using (true);

create policy "Suppliers can manage own products"
  on public.products for all
  using (
    exists (
      select 1 from public.suppliers
      where suppliers.id = products.supplier_id
      and suppliers.user_id = auth.uid()
    )
  );

-- Orders
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  gastronom_id uuid references auth.users(id) on delete cascade not null,
  supplier_id uuid references public.suppliers(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null check (payment_method in ('card', 'invoice')),
  total_amount integer not null check (total_amount >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Gastronomen can view own orders"
  on public.orders for select
  using (gastronom_id = auth.uid());

create policy "Gastronomen can create orders"
  on public.orders for insert
  with check (gastronom_id = auth.uid());

create policy "Lieferanten can view their orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.suppliers
      where suppliers.id = orders.supplier_id
      and suppliers.user_id = auth.uid()
    )
  );

-- Order Items
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete restrict not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  created_at timestamptz default now()
);

alter table public.order_items enable row level security;

create policy "Users can view order items for their orders"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and (orders.gastronom_id = auth.uid() or exists (
        select 1 from public.suppliers
        where suppliers.id = orders.supplier_id
        and suppliers.user_id = auth.uid()
      ))
    )
  );

create policy "Gastronomen can insert order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.gastronom_id = auth.uid()
    )
  );
