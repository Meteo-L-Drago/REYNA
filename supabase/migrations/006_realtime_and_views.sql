-- REYNA: Realtime + Analytics-Views für Backoffice
-- Führe im Supabase SQL Editor aus
-- Hinweis: Falls "relation is already a member" Fehler bei Realtime → Tabelle bereits aktiv, ignorieren.

-- ============ REALTIME FÜR ORDERS ============
-- Lieferanten erhalten sofort Updates bei neuen Bestellungen/Status-Änderungen
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- Replica Identity FULL für alte Werte bei UPDATE/DELETE (optional)
alter table public.orders replica identity full;
