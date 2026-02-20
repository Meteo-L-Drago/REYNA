-- REYNA: Teams, Rollen & Zugriffskontrolle für Lieferanten-Backoffice
-- Admin (Chef) = suppliers.user_id
-- Teamchefs + Teammitglieder = supplier_team_members
-- Führe im Supabase SQL Editor aus

-- ============ TEAMTYPEN ============
create type public.team_type as enum (
  'logistik',    -- Zusammenpacken, Versand – sieht Bestellungen
  'buchhaltung', -- Rechnungen – sieht KEINE Lieferstatus
  'vertrieb'     -- Deals, Kundenumsätze – jeder sieht seine eigenen
);

-- ============ TEAMS ============
create table if not exists public.supplier_teams (
  id uuid default gen_random_uuid() primary key,
  supplier_id uuid references public.suppliers(id) on delete cascade not null,
  name text not null,
  team_type public.team_type not null,
  created_at timestamptz default now(),
  unique(supplier_id, team_type)
);

alter table public.supplier_teams enable row level security;

-- ============ TEAMMITGLIEDER (inkl. Teamchefs) ============
create table if not exists public.supplier_team_members (
  id uuid default gen_random_uuid() primary key,
  supplier_id uuid references public.suppliers(id) on delete cascade not null,
  team_id uuid references public.supplier_teams(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  full_name text not null,
  email text not null,
  is_chief boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(supplier_id, user_id)
);

alter table public.supplier_team_members enable row level security;

-- ============ VERTRIEB: KUNDENZUORDNUNG ============
-- Welcher Vertriebler ist für welchen Gastronomen zuständig
create table if not exists public.customer_vertrieb_assignments (
  id uuid default gen_random_uuid() primary key,
  supplier_id uuid references public.suppliers(id) on delete cascade not null,
  gastronom_id uuid references auth.users(id) on delete cascade not null,
  vertrieb_user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(supplier_id, gastronom_id)
);

alter table public.customer_vertrieb_assignments enable row level security;

-- ============ HILFSFUNKTIONEN ============
-- Ist der User Supplier-Admin (Eigentümer)?
create or replace function public.is_supplier_admin(p_supplier_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.suppliers
    where id = p_supplier_id and user_id = auth.uid()
  );
$$;

-- Ist der User Teamchef eines Teams des Lieferanten?
create or replace function public.is_team_chief_of_supplier(p_supplier_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.supplier_team_members m
    join public.supplier_teams t on t.id = m.team_id
    where m.supplier_id = p_supplier_id
    and m.user_id = auth.uid()
    and m.is_chief = true
  );
$$;

-- Hat der User Zugriff auf den Lieferanten? (Admin ODER Teammitglied)
create or replace function public.can_access_supplier(p_supplier_id uuid)
returns boolean language sql security definer stable as $$
  select public.is_supplier_admin(p_supplier_id)
  or exists (
    select 1 from public.supplier_team_members
    where supplier_id = p_supplier_id and user_id = auth.uid()
  );
$$;


-- ============ RLS: SUPPLIER_TEAMS ============
create policy "Admin und Teammitglieder sehen Teams"
  on public.supplier_teams for select
  using (public.can_access_supplier(supplier_id));

create policy "Nur Admin erstellt Teams"
  on public.supplier_teams for insert
  with check (public.is_supplier_admin(supplier_id));

create policy "Nur Admin bearbeitet Teams"
  on public.supplier_teams for update
  using (public.is_supplier_admin(supplier_id));

create policy "Nur Admin löscht Teams"
  on public.supplier_teams for delete
  using (public.is_supplier_admin(supplier_id));

-- ============ RLS: SUPPLIER_TEAM_MEMBERS ============
create policy "Admin und Teamchefs sehen Mitglieder"
  on public.supplier_team_members for select
  using (
    public.is_supplier_admin(supplier_id)
    or user_id = auth.uid()
    or (
      public.is_team_chief_of_supplier(supplier_id)
      and team_id in (select team_id from public.supplier_team_members m2 where m2.supplier_id = supplier_team_members.supplier_id and m2.user_id = auth.uid() and m2.is_chief)
    )
  );

create policy "Nur Admin erstellt Mitglieder"
  on public.supplier_team_members for insert
  with check (public.is_supplier_admin(supplier_id));

create policy "Admin und Teamchef bearbeiten Mitglieder"
  on public.supplier_team_members for update
  using (
    public.is_supplier_admin(supplier_id)
    or (public.is_team_chief_of_supplier(supplier_id) and team_id in (select team_id from public.supplier_team_members m2 where m2.supplier_id = supplier_team_members.supplier_id and m2.user_id = auth.uid() and m2.is_chief))
  );

create policy "Nur Admin löscht Mitglieder"
  on public.supplier_team_members for delete
  using (public.is_supplier_admin(supplier_id));

-- ============ RLS: CUSTOMER_VERTRIEB_ASSIGNMENTS ============
create policy "Vertrieb sieht eigene Zuordnungen"
  on public.customer_vertrieb_assignments for select
  using (
    public.is_supplier_admin(supplier_id)
    or vertrieb_user_id = auth.uid()
    or public.is_team_chief_of_supplier(supplier_id)
  );

create policy "Admin und Teamchef erstellen Zuordnungen"
  on public.customer_vertrieb_assignments for insert
  with check (
    public.is_supplier_admin(supplier_id)
    or public.is_team_chief_of_supplier(supplier_id)
  );

create policy "Admin und Teamchef bearbeiten Zuordnungen"
  on public.customer_vertrieb_assignments for update
  using (public.is_supplier_admin(supplier_id) or public.is_team_chief_of_supplier(supplier_id));

create policy "Admin und Teamchef löschen Zuordnungen"
  on public.customer_vertrieb_assignments for delete
  using (public.is_supplier_admin(supplier_id) or public.is_team_chief_of_supplier(supplier_id));

-- ============ ORDERS: Rollenbasierter Zugriff ============
-- Logistik: sieht Bestellungen + Lieferstatus
-- Buchhaltung: sieht Bestellungen OHNE Lieferstatus (nur Rechnungsdaten)
-- Admin/Teamchef: sieht alles

-- Logistik + Teamchefs: sehen Bestellungen (inkl. Lieferstatus)
create policy "Logistik und Teamchefs sehen Bestellungen"
  on public.orders for select
  using (
    public.is_team_chief_of_supplier(orders.supplier_id)
    or exists (
      select 1 from public.supplier_team_members m
      join public.supplier_teams t on t.id = m.team_id
      where m.supplier_id = orders.supplier_id and m.user_id = auth.uid()
      and t.team_type = 'logistik'
    )
  );

-- Buchhaltung: sieht Bestellungen (Frontend nutzt View für Spalten ohne status)
-- Für Buchhaltung: Gleiche orders Tabelle, aber Frontend zeigt nur Rechnungsrelevantes (Datum, Betrag, Kunde) - kein Versandstatus
-- Oder: Buchhaltung sieht orders mit reduzierten Spalten - das geht mit einer View
create or replace view public.orders_buchhaltung as
select id, gastronom_id, supplier_id, total_amount, payment_method, created_at
from public.orders;

-- RLS auf View: Buchhaltung sieht nur Rechnungsdaten (kein status)
alter view public.orders_buchhaltung set (security_invoker = on);

create policy "Buchhaltung-Team sieht Bestellungen"
  on public.orders for select
  using (
    exists (
      select 1 from public.supplier_team_members m
      join public.supplier_teams t on t.id = m.team_id
      where m.supplier_id = orders.supplier_id and m.user_id = auth.uid()
      and t.team_type = 'buchhaltung'
    )
  );

-- Vertrieb: sieht Orders nur für zugeordnete Kunden
create policy "Vertrieb sieht eigene Kunden-Bestellungen"
  on public.orders for select
  using (
    exists (
      select 1 from public.customer_vertrieb_assignments c
      where c.supplier_id = orders.supplier_id
      and c.gastronom_id = orders.gastronom_id
      and c.vertrieb_user_id = auth.uid()
    )
  );

-- ============ ERWEITERUNG: Teammitglieder dürfen Lieferant-Zugang haben ============
-- profiles.role bleibt 'lieferant' für alle (Admin + Team)
-- Backoffice-Zugang prüfen wir über: is_supplier_admin OR exists in supplier_team_members
