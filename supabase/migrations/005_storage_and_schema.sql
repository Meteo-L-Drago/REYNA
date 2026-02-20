-- REYNA: Professionelle Storage & Schema-Erweiterungen
-- 1. Storage Policies für product-images & avatars (Buckets vorher per Skript erstellen: node scripts/setup-storage.js)
-- 2. Profiles/Suppliers erweitern
-- Führe in Supabase SQL Editor aus

-- ============ STORAGE RLS POLICIES ============
drop policy if exists "Lieferanten können Produktbilder hochladen" on storage.objects;
create policy "Lieferanten können Produktbilder hochladen"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] in (
    select suppliers.id::text from public.suppliers
    where suppliers.user_id = auth.uid()
  )
);

drop policy if exists "Produktbilder öffentlich lesbar" on storage.objects;
create policy "Produktbilder öffentlich lesbar"
on storage.objects for select
to public
using (bucket_id = 'product-images');

drop policy if exists "Lieferanten können eigene Produktbilder bearbeiten" on storage.objects;
create policy "Lieferanten können eigene Produktbilder bearbeiten"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] in (
    select suppliers.id::text from public.suppliers
    where suppliers.user_id = auth.uid()
  )
);

drop policy if exists "Lieferanten können eigene Produktbilder löschen" on storage.objects;
create policy "Lieferanten können eigene Produktbilder löschen"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] in (
    select suppliers.id::text from public.suppliers
    where suppliers.user_id = auth.uid()
  )
);

drop policy if exists "User können Avatar hochladen" on storage.objects;
create policy "User können Avatar hochladen"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Avatare öffentlich lesbar" on storage.objects;
create policy "Avatare öffentlich lesbar"
on storage.objects for select
to public
using (bucket_id = 'avatars');

drop policy if exists "User können eigenen Avatar bearbeiten" on storage.objects;
create policy "User können eigenen Avatar bearbeiten"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "User können eigenen Avatar löschen" on storage.objects;
create policy "User können eigenen Avatar löschen"
on storage.objects for delete
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============ SCHEMA ERWEITERUNGEN ============
-- Profiles: Avatar-URL
alter table public.profiles
add column if not exists avatar_url text;

-- Suppliers: Logo-URL
alter table public.suppliers
add column if not exists logo_url text;

-- Produkt-Kategorien (optional, für bessere Filterung)
create table if not exists public.product_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  sort_order int default 0
);

insert into public.product_categories (name, sort_order) values
  ('Getränke', 1),
  ('Frischware', 2),
  ('Trockenware', 3),
  ('Tiefkühl', 4),
  ('Sonstiges', 99)
on conflict (name) do nothing;

-- FK von products.category auf product_categories (optional, name als text beibehalten)
-- products.category bleibt text für Flexibilität
