# REYNA Backoffice – Lieferanten

Web-Dashboard für Großhändler und Lieferanten: Zahlen, Rechnungen, Umsätze und Verkäufe einsehen und auswerten.

## Features

- **Übersicht** – KPIs, Umsatz-Chart (7/30/90 Tage), letzte Bestellungen
- **Produkte** – Liste, bearbeiten, hinzufügen, löschen, Preise anpassen, Bilder hochladen
- **Rechnungen** – Bestellungen mit Status ändern, Rechnung drucken, CSV-Export
- **Kataloge** – PDF-Kataloge hochladen und verwalten
- **Echtzeit** – Live-Updates bei neuen Bestellungen (Supabase Realtime)

## Voraussetzungen

- Node.js 20+
- Supabase-Projekt mit REYNA-Schema (gleiche Datenbank wie die Mobile App)

## Einrichtung

### 1. Umgebungsvariablen

Erstelle `backoffice/.env.local` mit denselben Werten wie im REYNA-Hauptprojekt:

```env
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
```

Oder kopiere aus dem Hauptprojekt:

```bash
cd .. && grep -E "EXPO_PUBLIC_SUPABASE" .env | sed 's/EXPO_PUBLIC_/NEXT_PUBLIC_/g' > backoffice/.env.local
```

### 2. Starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

### 3. Migrationen in Supabase ausführen

Im **Supabase SQL Editor** nacheinander ausführen:
- `006_realtime_and_views.sql` – Realtime für Bestellungen
- `007_backoffice_features.sql` – Bestellstatus, Kataloge, Rechnungsdruck

Dann im Projektordner: `node scripts/setup-storage.js` (erstellt u.a. den Kataloge-Bucket).

### 4. Anmelden

Nur **Lieferanten** haben Zugang. Test-Account:

- **E-Mail:** lieferant@test.com  
- **Passwort:** ReynaTest123!

## Tech Stack

- Next.js 16 (App Router)
- Supabase (Auth + Datenbank)
- Tailwind CSS
- Recharts
