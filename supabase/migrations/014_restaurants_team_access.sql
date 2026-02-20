-- REYNA: Teammitglieder können Restaurant-Namen von Bestellkunden sehen (für Vertrieb etc.)

create policy "Team members can view restaurants of supplier order customers"
  on public.restaurants for select
  using (
    exists (
      select 1 from public.orders o
      join public.supplier_team_members m on m.supplier_id = o.supplier_id and m.user_id = auth.uid()
      where o.gastronom_id = restaurants.gastronom_id
    )
  );
