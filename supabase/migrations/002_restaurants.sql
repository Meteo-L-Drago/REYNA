-- REYNA: Restaurant/Kunden-Profil für Gastronomen
-- Enthält Adresse, Name, Kontakt etc.

create table if not exists public.restaurants (
  id uuid default gen_random_uuid() primary key,
  gastronom_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  street text not null,
  postal_code text not null,
  city text not null,
  country text default 'Deutschland',
  phone text,
  delivery_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.restaurants enable row level security;

create policy "Gastronomen can view own restaurant"
  on public.restaurants for select
  using (gastronom_id = auth.uid());

create policy "Gastronomen can insert own restaurant"
  on public.restaurants for insert
  with check (gastronom_id = auth.uid());

create policy "Gastronomen can update own restaurant"
  on public.restaurants for update
  using (gastronom_id = auth.uid());
