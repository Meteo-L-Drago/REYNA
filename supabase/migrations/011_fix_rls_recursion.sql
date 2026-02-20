-- REYNA: Behebt "infinite recursion detected in policy for relation supplier_team_members"
-- Die Policy referenzierte supplier_team_members in einer Subquery → Rekursion

-- Hilfsfunktion: Team-IDs, in denen der User Chef ist (SECURITY DEFINER = kein RLS)
create or replace function public.my_chief_team_ids(p_supplier_id uuid)
returns setof uuid language sql security definer stable as $$
  select team_id from public.supplier_team_members
  where supplier_id = p_supplier_id and user_id = auth.uid() and is_chief = true;
$$;

-- Alte Policies entfernen
drop policy if exists "Admin und Teamchefs sehen Mitglieder" on public.supplier_team_members;
drop policy if exists "Admin und Teamchef bearbeiten Mitglieder" on public.supplier_team_members;

-- SELECT: Ohne rekursive Subquery
create policy "Admin und Teamchefs sehen Mitglieder"
  on public.supplier_team_members for select
  using (
    public.is_supplier_admin(supplier_id)
    or user_id = auth.uid()
    or (public.is_team_chief_of_supplier(supplier_id) and team_id in (select public.my_chief_team_ids(supplier_id)))
  );

-- UPDATE: Ohne rekursive Subquery
create policy "Admin und Teamchef bearbeiten Mitglieder"
  on public.supplier_team_members for update
  using (
    public.is_supplier_admin(supplier_id)
    or (public.is_team_chief_of_supplier(supplier_id) and team_id in (select public.my_chief_team_ids(supplier_id)))
  );
