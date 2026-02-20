/**
 * REYNA: Storage Buckets erstellen
 * Verwendet service_role Key für Supabase Storage.
 * Führe aus: node scripts/setup-storage.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Fehler: EXPO_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY in .env erforderlich.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function createBucket(name, options) {
  const { data, error } = await supabase.storage.createBucket(name, options);
  if (error) {
    if (error.message?.includes('already exists')) {
      console.log(`✓ Bucket "${name}" existiert bereits`);
      return;
    }
    console.error(`❌ ${name}:`, error.message);
    return;
  }
  console.log(`✓ Bucket "${name}" erstellt`);
}

async function main() {
  console.log('Erstelle REYNA Storage Buckets...\n');

  await createBucket('product-images', {
    public: true,
    fileSizeLimit: 5242880,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });

  await createBucket('avatars', {
    public: true,
    fileSizeLimit: 2097152,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });

  await createBucket('catalogs', {
    public: true,
    fileSizeLimit: 20971520,
    allowedMimeTypes: ['application/pdf'],
  });

  console.log('\n✅ Fertig! Führe die Migrationen 005, 006, 007 im Supabase SQL Editor aus.');
}

main().catch(console.error);
