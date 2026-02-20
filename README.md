# REYNA

Bestellplattform für Gastronomen – Ware bei Lieferanten mit wenigen Klicks bestellen.

## Setup

### 1. Supabase einrichten

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein Projekt (Region: Frankfurt).
2. Im Dashboard: **SQL Editor** → Neues Query → Inhalt von `supabase/migrations/001_initial_schema.sql` einfügen → Ausführen.
3. Unter **Settings → API** findest du `Project URL` und `anon public` Key.

### 2. Umgebungsvariablen

Kopiere `.env.example` zu `.env` und trage deine Supabase-Daten ein:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
```

### 3. App starten

```bash
npm install
npx expo start
```

- **iOS Simulator**: `i` im Terminal
- **Android Emulator**: `a` im Terminal
- **Expo Go** auf dem Handy: QR-Code scannen

## Features

- **Gastronomen**: Lieferanten durchsuchen, Produkte in den Warenkorb legen, bestellen (Auf Rechnung oder per Karte)
- **Lieferanten**: Produkte anlegen und verwalten, Bestellungen einsehen

## Tech Stack

- React Native + Expo
- Supabase (Auth, Database)
- React Navigation
- TypeScript

## Nächste Schritte

- [ ] Stripe für Sofort-Zahlung integrieren
- [ ] Push-Benachrichtigungen
- [ ] EAS Build für App Store / Play Store
