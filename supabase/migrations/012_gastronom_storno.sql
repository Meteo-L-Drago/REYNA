-- REYNA: Gastronom darf eigene Bestellung stornieren (nur pending/confirmed)

create policy "Gastronomen können eigene Bestellung stornieren"
  on public.orders for update
  using (
    gastronom_id = auth.uid()
    and status in ('pending', 'confirmed')
  )
  with check (
    gastronom_id = auth.uid()
    and status = 'cancelled'
  );
