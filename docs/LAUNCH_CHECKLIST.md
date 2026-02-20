# REYNA – Launch-Checkliste

Vor dem Veröffentlichen von App und Backoffice.

---

## 1. Supabase-Migrationen

Führe alle Migrationen im Supabase SQL Editor aus (in Reihenfolge):

- `001_initial_schema.sql`
- `002_restaurants.sql`
- … alle weiteren bis …
- `014_restaurants_team_access.sql`

---

## 2. EAS Build (App Stores)

### Schritt 1: Vorbereitung

```bash
npm install
eas login          # Einmalig: Mit Expo-Account anmelden
eas build:configure   # Einmalig: Projekt mit EAS verknüpfen
```

### Schritt 2: Secrets aus .env einrichten

Stelle sicher, dass `.env` die Supabase-Daten enthält (aus Supabase Dashboard → Settings → API). Dann:

```bash
npm run eas:secrets
```

Das liest `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` und optional `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` aus `.env` und schreibt sie als EAS Secrets.

### Schritt 3: Build starten

```bash
npm run eas:build:ios       # oder
npm run eas:build:android   # oder
npm run eas:build           # beide Plattformen
```

---

## 3. Backoffice (Vercel o.ä.)

- `.env` oder Umgebungsvariablen setzen:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SITE_URL` (Produktions-URL, z.B. `https://backoffice.reyna.app`)

- Supabase Auth: Redirect-URL für OAuth hinzufügen (falls verwendet)

---

## 4. Mindestbestellwert (optional)

In Supabase → `suppliers` → Spalte `min_order_amount` (in Cent, z.B. 5000 = 50 €).

---

## 5. Store-Anforderungen

- **Apple:** Bundle ID `com.reyna.app`, App Privacy, Datenschutzerklärung
- **Google:** Package `com.reyna.app`, Datenschutzerklärung
- **Datenschutzerklärung** auf einer Webseite bereitstellen und verlinken

---

## Neue Features (bereits umgesetzt)

| Feature | App | Backoffice |
|---------|-----|------------|
| Bestelldetails | ✅ OrderDetailScreen | – |
| Produktsuche + Kategoriefilter | ✅ ProductCatalogScreen | – |
| Storno durch Gastronom | ✅ OrderDetailScreen | – |
| Mindestbestellwert | ✅ Checkout | Migration 013 |
| Buchhaltung CSV-Export | – | ✅ |
| Vertrieb Kundennamen | ✅ | ✅ |
| Gastronom-Profil (Restaurant bearbeiten) | ✅ RestaurantProfileScreen | – |
| Test-Login nur in Dev | ✅ | ✅ |
