-- REYNA: Team-Einladung verbessern – Personal-ID + Einladungsstatus
-- Führe im Supabase SQL Editor aus

alter table public.supplier_team_members
  add column if not exists personal_id text;

alter table public.supplier_team_members
  add column if not exists invitation_status text default 'accepted';

comment on column public.supplier_team_members.personal_id is 'Eindeutige Mitarbeiter-Nummer (z.B. MIT-001)';
comment on column public.supplier_team_members.invitation_status is 'pending = Einladung ausstehend, accepted = akzeptiert';
