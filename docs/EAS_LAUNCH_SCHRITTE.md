# EAS Build – Schritte zum Launch

Diese Schritte musst du **selbst im Terminal** ausführen (einmalig Login erforderlich).

---

## 1. Bei Expo anmelden

```bash
cd /Users/serwanpolat/REYNA
npx eas-cli login
```

→ Browser öffnet sich, du meldest dich mit deinem Expo-Account an (kostenlos erstellbar auf expo.dev).

---

## 2. Projekt mit EAS verknüpfen (einmalig)

```bash
npx eas-cli build:configure
```

→ Falls gefragt: Projekt erstellen oder bestehendes verknüpfen.

---

## 3. Secrets aus .env einrichten

```bash
npm run eas:secrets
```

→ Liest `.env` und schreibt die Werte nach EAS.

---

## 4. Build starten

**iOS:**
```bash
npm run eas:build:ios
```

**Android:**
```bash
npm run eas:build:android
```

**Beide:**
```bash
npm run eas:build
```

→ Build läuft in der Expo-Cloud. Link zum Download erscheint im Terminal und auf expo.dev.

---

## Hinweis

`eas login` ist **interaktiv** – es muss in deinem Terminal laufen. Ein Skript kann dich nicht automatisch einloggen.
