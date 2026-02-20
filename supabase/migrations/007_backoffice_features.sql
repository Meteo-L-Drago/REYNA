-- REYNA: Backoffice Features - Lieferanten-Kataloge, Bestellstatus
-- Führe im Supabase SQL Editor aus
-- Danach: node scripts/setup-storage.js (fügt Kataloge-Bucket hinzu)

-- ============ LIEFERANTEN DÜRFEN RESTAURANTS IHRER KUNDEN SEHEN ============
-- Für Rechnungsdruck mit Kundendaten
create policy "Suppliers can view restaurants of their order customers"
  on public.restaurants for select
  using (
    exists (
      select 1 from public.orders o
      join public.suppliers s on s.id = o.supplier_id and s.user_id = auth.uid()
      where o.gastronom_id = restaurants.gastronom_id
    )
  );

-- ============ LIEFERANTEN KÖNNEN BESTELLSTATUS ÄNDERN ============
create policy "Lieferanten can update their orders"
  on public.orders for update
  using (
    exists (
      select 1 from public.suppliers
      where suppliers.id = orders.supplier_id
      and suppliers.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.suppliers
      where suppliers.id = orders.supplier_id
      and suppliers.user_id = auth.uid()
    )
  );

-- ============ SUPPLIER CATALOGS ============
create table if not exists public.supplier_catalogs (
  id uuid default gen_random_uuid() primary key,
  supplier_id uuid references public.suppliers(id) on delete cascade not null,
  name text not null,
  file_path text not null,
  file_size int,
  created_at timestamptz default now()
);

alter table public.supplier_catalogs enable row level security;

create policy "Lieferanten can manage own catalogs"
  on public.supplier_catalogs for all
  using (
    exists (
      select 1 from public.suppliers
      where suppliers.id = supplier_catalogs.supplier_id
      and suppliers.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.suppliers
      where suppliers.id = supplier_catalogs.supplier_id
      and suppliers.user_id = auth.uid()
    )
  );

create policy "Gastronomen can view supplier catalogs"
  on public.supplier_catalogs for select
  using (true);

-- ============ STORAGE: KATALOGE ============
drop policy if exists "Lieferanten können Kataloge hochladen" on storage.objects;
create policy "Lieferanten können Kataloge hochladen"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'catalogs'
  and (storage.foldername(name))[1] in (
    select suppliers.id::text from public.suppliers
    where suppliers.user_id = auth.uid()
  )
);

drop policy if exists "Kataloge öffentlich lesbar" on storage.objects;
create policy "Kataloge öffentlich lesbar"
on storage.objects for select
to public
using (bucket_id = 'catalogs');

drop policy if exists "Lieferanten können eigene Kataloge löschen" on storage.objects;
create policy "Lieferanten können eigene Kataloge löschen"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'catalogs'
  and (storage.foldername(name))[1] in (
    select suppliers.id::text from public.suppliers
    where suppliers.user_id = auth.uid()
  )
);
