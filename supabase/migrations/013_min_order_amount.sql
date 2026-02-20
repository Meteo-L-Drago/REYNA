-- REYNA: Mindestbestellwert pro Lieferant (in Cent)

alter table public.suppliers
  add column if not exists min_order_amount integer default 0 check (min_order_amount >= 0);

comment on column public.suppliers.min_order_amount is 'Mindestbestellwert in Cent (0 = kein Mindestbestellwert)';
