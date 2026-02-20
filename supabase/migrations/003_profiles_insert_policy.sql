-- Behebt: "new row violates row-level security policy for table 'profiles'"
-- Benutzer, die manuell im Dashboard angelegt wurden oder deren Trigger-Profil fehlt,
-- brauchen die Berechtigung, ihr eigenes Profil anlegen zu können.

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
