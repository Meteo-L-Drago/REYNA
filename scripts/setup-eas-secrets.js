#!/usr/bin/env node
/**
 * EAS Secrets aus .env in Expo einrichten
 * Verwendung: node scripts/setup-eas-secrets.js
 *
 * Voraussetzung: .env mit EXPO_PUBLIC_* Variablen
 * Voraussetzung: eas login bereits ausgeführt
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
if (!fs.existsSync(envPath)) {
  console.error('Fehler: .env nicht gefunden. Kopiere .env.example nach .env und trage deine Werte ein.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    if (key.startsWith('EXPO_PUBLIC_')) env[key] = value;
  }
});

const secrets = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_GOOGLE_PLACES_API_KEY',
];

function shellEscape(val) {
  if (process.platform === 'win32') return `"${val.replace(/"/g, '""')}"`;
  return `"${val.replace(/'/g, "'\\''").replace(/"/g, '\\"')}"`;
}

console.log('EAS Secrets aus .env einrichten...\n');
let ok = 0;
for (const name of secrets) {
  const value = env[name];
  if (!value && name !== 'EXPO_PUBLIC_GOOGLE_PLACES_API_KEY') {
    console.warn(`Warnung: ${name} fehlt in .env – übersprungen`);
    continue;
  }
  if (name === 'EXPO_PUBLIC_GOOGLE_PLACES_API_KEY' && !value) {
    console.log(`  ${name}: optional, übersprungen`);
    continue;
  }
  try {
    execSync(`npx eas-cli secret:create --name ${name} --value ${shellEscape(value)} --force --non-interactive`, {
      stdio: 'inherit',
      cwd: root,
    });
    console.log(`  ${name}: gesetzt\n`);
    ok++;
  } catch (e) {
    const msg = (e.stderr || e.stdout || e.message || '').toString();
    console.error(`Fehler bei ${name}:`, msg.slice(0, 300));
    if (msg.includes('log in') || msg.includes('Expo user account')) {
      console.error('\n  → Führe zuerst aus: npx eas-cli login\n');
    }
  }
}
console.log(`\nFertig. ${ok} Secret(s) gesetzt. Prüfe mit: eas secret:list`);
