-- REYNA: Logistik-Versand – is_packed, RLS für Team-Zugriff auf order_items
-- Logistik kann Produkte/Bestellungen abhaken, Chefs sehen live

-- ============ REALTIME für Live-Updates ============
-- Chefs sehen Packfortschritt live
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'order_items') then
    alter publication supabase_realtime add table public.order_items;
  end if;
end $$;

-- ============ ORDER_ITEMS: Spalte is_packed ============
alter table public.order_items
  add column if not exists is_packed boolean default false;

-- ============ ORDER_ITEMS: Teammitglieder können lesen ============
-- Bisher: nur Gastronom + Supplier-Owner. Jetzt auch Logistik, Buchhaltung, Vertrieb, Teamchefs
create policy "Teammitglieder sehen order_items ihrer Bestellungen"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
      and (
        public.is_team_chief_of_supplier(o.supplier_id)
        or exists (
          select 1 from public.supplier_team_members m
          join public.supplier_teams t on t.id = m.team_id
          where m.supplier_id = o.supplier_id and m.user_id = auth.uid()
          and t.team_type in ('logistik', 'buchhaltung')
        )
        or exists (
          select 1 from public.customer_vertrieb_assignments c
          where c.supplier_id = o.supplier_id
          and c.gastronom_id = o.gastronom_id
          and c.vertrieb_user_id = auth.uid()
        )
      )
    )
  );

-- ============ ORDERS: Logistik + Teamchefs dürfen updaten ============
-- Bisher nur Lieferant-Owner. Erweitern für Teammitglieder mit Logistik/Teamchef
create policy "Logistik und Teamchefs können Bestellstatus ändern"
  on public.orders for update
  using (
    public.is_team_chief_of_supplier(orders.supplier_id)
    or exists (
      select 1 from public.supplier_team_members m
      join public.supplier_teams t on t.id = m.team_id
      where m.supplier_id = orders.supplier_id
      and m.user_id = auth.uid()
      and t.team_type = 'logistik'
    )
  )
  with check (
    public.is_team_chief_of_supplier(orders.supplier_id)
    or exists (
      select 1 from public.supplier_team_members m
      join public.supplier_teams t on t.id = m.team_id
      where m.supplier_id = orders.supplier_id
      and m.user_id = auth.uid()
      and t.team_type = 'logistik'
    )
  );

-- ============ ORDER_ITEMS: Logistik + Teamchefs + Admin dürfen is_packed setzen ============
create policy "Logistik Teamchefs Admin können order_items packen"
  on public.order_items for update
  using (
    public.is_supplier_admin((
      select supplier_id from public.orders where id = order_items.order_id
    ))
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
      and (
        public.is_team_chief_of_supplier(o.supplier_id)
        or exists (
          select 1 from public.supplier_team_members m
          join public.supplier_teams t on t.id = m.team_id
          where m.supplier_id = o.supplier_id and m.user_id = auth.uid()
          and t.team_type = 'logistik'
        )
      )
    )
  )
  with check (
    public.is_supplier_admin((
      select supplier_id from public.orders where id = order_items.order_id
    ))
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
      and (
        public.is_team_chief_of_supplier(o.supplier_id)
        or exists (
          select 1 from public.supplier_team_members m
          join public.supplier_teams t on t.id = m.team_id
          where m.supplier_id = o.supplier_id and m.user_id = auth.uid()
          and t.team_type = 'logistik'
        )
      )
    )
  );
