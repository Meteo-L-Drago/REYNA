-- Test-Account Profile Setup
-- Nach dem Anlegen des Users im Dashboard (Authentication > Users) ausführen.
-- User: gastronom@test.com / ReynaTest123!

INSERT INTO public.profiles (id, email, full_name, role, updated_at)
SELECT id, email, 'Test Gastronom', 'gastronom', now()
FROM auth.users WHERE email = 'gastronom@test.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = EXCLUDED.updated_at;
