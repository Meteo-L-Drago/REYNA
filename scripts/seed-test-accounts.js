/**
 * Test-Accounts für REYNA erstellen
 *
 * Erstellt: Gastronom, Admin (Lieferant), Logistik, Buchhaltung, Vertrieb
 * Alle Teammitglieder im Backoffice sichtbar (Team-Seite des Admins)
 *
 * Für service_role Key: Supabase Dashboard > Settings > API > service_role secret
 * In .env hinzufügen: SUPABASE_SERVICE_ROLE_KEY=dein-key
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    });
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Fehler: EXPO_PUBLIC_SUPABASE_URL und EXPO_PUBLIC_SUPABASE_ANON_KEY in .env erforderlich.');
  process.exit(1);
}
if (!SERVICE_KEY) {
  console.error('Fehler: SUPABASE_SERVICE_ROLE_KEY in .env erforderlich (Supabase Dashboard > Settings > API).');
  process.exit(1);
}

const supabase = SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : createClient(SUPABASE_URL, ANON_KEY);

const PASSWORD = 'ReynaTest123!';

// Gastronom + Admin + 3 Teammitglieder (Logistik, Buchhaltung, Vertrieb)
const ACCOUNTS = [
  { email: 'gastronom@test.com', password: PASSWORD, role: 'gastronom', fullName: 'Test Gastronom' },
  {
    email: 'lieferant@test.com',
    password: PASSWORD,
    role: 'lieferant',
    fullName: 'Test Admin',
    companyName: 'Test Großhandel GmbH',
    isSupplierAdmin: true,
  },
  {
    email: 'test-logistik@reyna.demo',
    password: PASSWORD,
    role: 'lieferant',
    fullName: 'Test Logistik',
    teamType: 'logistik',
  },
  {
    email: 'test-buchhaltung@reyna.demo',
    password: PASSWORD,
    role: 'lieferant',
    fullName: 'Test Buchhaltung',
    teamType: 'buchhaltung',
  },
  {
    email: 'test-vertrieb@reyna.demo',
    password: PASSWORD,
    role: 'lieferant',
    fullName: 'Test Vertrieb',
    teamType: 'vertrieb',
  },
];

async function createOrGetUser(acc) {
  if (!SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY erforderlich für Team-Accounts. Nur signUp möglich.');
  }
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = listData?.users?.find((x) => x.email === acc.email);
  if (existing) return existing;

  const { data, error } = await supabase.auth.admin.createUser({
    email: acc.email,
    password: acc.password,
    email_confirm: true,
    user_metadata: { full_name: acc.fullName },
  });
  if (error) {
    if (error.message?.includes('already') || error.message?.includes('registered')) {
      const { data: retry } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const found = retry?.users?.find((x) => x.email === acc.email);
      if (found) return found;
    }
    throw new Error(`${acc.email}: ${error.message}`);
  }
  return data.user;
}

async function setupProfile(userId, acc) {
  await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        email: acc.email,
        full_name: acc.fullName,
        role: acc.role,
        company_name: acc.companyName || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
}

async function ensureSupplierAndTeams(adminUserId) {
  let { data: supplier } = await supabase.from('suppliers').select('id').eq('user_id', adminUserId).single();
  if (!supplier) {
    const { data: ins } = await supabase.from('suppliers').insert({ user_id: adminUserId, company_name: 'Test Großhandel GmbH' }).select('id').single();
    supplier = ins;
  }
  const supplierId = supplier.id;

  const teamTypes = ['logistik', 'buchhaltung', 'vertrieb'];
  const teamNames = { logistik: 'Logistik', buchhaltung: 'Buchhaltung', vertrieb: 'Vertrieb' };
  const teams = {};
  for (const tt of teamTypes) {
    let { data: t } = await supabase
      .from('supplier_teams')
      .select('id')
      .eq('supplier_id', supplierId)
      .eq('team_type', tt)
      .single();
    if (!t) {
      const { data: ins } = await supabase.from('supplier_teams').insert({ supplier_id: supplierId, name: teamNames[tt], team_type: tt }).select('id').single();
      t = ins;
    }
    teams[tt] = t.id;
  }
  return { supplierId, teams };
}

async function addTeamMember(supplierId, teamId, userId, fullName, email) {
  const { error } = await supabase.from('supplier_team_members').upsert(
    {
      supplier_id: supplierId,
      team_id: teamId,
      user_id: userId,
      full_name: fullName,
      email,
      is_chief: false,
      invitation_status: 'accepted',
    },
    { onConflict: 'supplier_id,user_id' }
  );
  if (error) throw new Error(`supplier_team_members: ${error.message}`);
}

async function assignVertriebToGastronom(supplierId, gastronomId, vertriebUserId) {
  await supabase
    .from('customer_vertrieb_assignments')
    .upsert(
      { supplier_id: supplierId, gastronom_id: gastronomId, vertrieb_user_id: vertriebUserId },
      { onConflict: 'supplier_id,gastronom_id' }
    );
}

async function main() {
  console.log('Erstelle REYNA Test-Accounts...\n');

  const userIds = {};
  for (const acc of ACCOUNTS) {
    try {
      const user = await createOrGetUser(acc);
      userIds[acc.email] = user.id;
      await setupProfile(user.id, acc);
      if (acc.isSupplierAdmin) {
        await supabase.from('suppliers').upsert({ user_id: user.id, company_name: acc.companyName }, { onConflict: 'user_id' });
      }
      if (acc.email === 'gastronom@test.com') {
        await supabase
          .from('restaurants')
          .upsert(
            {
              gastronom_id: user.id,
              name: 'Test Restaurant',
              street: 'Teststraße 1',
              postal_code: '10115',
              city: 'Berlin',
              country: 'Deutschland',
            },
            { onConflict: 'gastronom_id' }
          );
      }
      console.log(`✓ ${acc.email}`);
    } catch (e) {
      console.log(`❌ ${acc.email}:`, e.message);
    }
  }

  const adminId = userIds['lieferant@test.com'];
  const gastronomId = userIds['gastronom@test.com'];
  const vertriebId = userIds['test-vertrieb@reyna.demo'];

  if (adminId) {
    const { supplierId, teams } = await ensureSupplierAndTeams(adminId);

    for (const acc of ACCOUNTS) {
      if (!acc.teamType) continue;
      const uid = userIds[acc.email];
      if (!uid) continue;
      await addTeamMember(supplierId, teams[acc.teamType], uid, acc.fullName, acc.email);
      console.log(`  → ${acc.email} als ${acc.teamType} zugeordnet`);
    }

    if (gastronomId && vertriebId) {
      await assignVertriebToGastronom(supplierId, gastronomId, vertriebId);
      console.log('  → Test Restaurant dem Test Vertrieb zugeordnet');
    }
  }

  console.log('\n✅ Fertig!\n');
  console.log('Test-Zugang (App + Backoffice):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:       lieferant@test.com');
  console.log('Logistik:    test-logistik@reyna.demo');
  console.log('Buchhaltung: test-buchhaltung@reyna.demo');
  console.log('Vertrieb:    test-vertrieb@reyna.demo');
  console.log('Gastronom:   gastronom@test.com');
  console.log('Passwort:    ReynaTest123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nApp: „Test-Zugang“ → Rolle wählen → direkt drin');
  console.log('Backoffice: „Test-Zugang: Buchhaltung“ / „Test-Zugang: Vertrieb“');
}

main().catch(console.error);
