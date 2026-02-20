# REYNA Backoffice – Schritt-für-Schritt Deployment auf Vercel

## Übersicht

Diese Anleitung führt dich durch das Deployment des REYNA-Backoffices auf Vercel. Voraussetzung: Node.js läuft lokal, Backoffice funktioniert mit `npm run dev`.

---

## Schritt 1: Projekt bei GitHub hochladen

### 1a. Neues Repository auf GitHub erstellen

1. Gehe zu [github.com/new](https://github.com/new)
2. **Repository name:** z.B. `REYNA` oder `reyna-platform`
3. **Description:** optional
4. **Visibility:** Private oder Public
5. **WICHTIG:** Keine README, .gitignore oder License hinzufügen (Projekt existiert schon)
6. Klicke auf **Create repository**

### 1b. Lokales Projekt mit GitHub verbinden

Da `backoffice` aktuell ein Submodul ist, gibt es zwei Wege:

**Option A – Einfach (empfohlen):** Backoffice als normales Verzeichnis einbinden

```bash
cd /Users/serwanpolat/REYNA

# Submodul entfernen, Dateien behalten
git rm --cached backoffice
rm -rf backoffice/.git

# Backoffice als normales Verzeichnis hinzufügen
git add backoffice/

# Alle Änderungen committen
git add .
git commit -m "Backoffice integriert, bereit für Vercel"

# Remote hinzufügen (ersetze DEIN-USERNAME und REYNA durch deine Werte)
git remote add origin https://github.com/DEIN-USERNAME/REYNA.git

# Pushen
git push -u origin main
```

**Option B – Submodul beibehalten:** In Vercel unter **Settings → Git** die Option **Include Git Submodules** aktivieren. Submodul-Repo muss ebenfalls auf GitHub sein.

### 1c. Falls noch kein Git vorhanden war

```bash
cd /Users/serwanpolat/REYNA
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/REYNA.git
git push -u origin main
```

---

## Schritt 2: Vercel-Projekt anlegen

1. Gehe zu [vercel.com](https://vercel.com) und melde dich an (oder erstelle einen Account).
2. Klicke auf **„Add New…“** → **„Project“**.
3. **Import** dein GitHub-Repository (REYNA).
4. **Root Directory:** Wähle `backoffice` aus.  
   → So baut Vercel nur das Backoffice, nicht die App.
5. **Framework Preset:** Next.js (wird automatisch erkannt).
6. **Build Command:** `npm run build`  
7. **Output Directory:** leer lassen (Next.js-Standard)
8. **Install Command:** `npm install`

---

## Schritt 3: Umgebungsvariablen setzen

Unter **Environment Variables** im Vercel-Setup füge hinzu:

| Name | Wert | Hinweis |
|------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dein-projekt.supabase.co` | Aus deiner `.env.local` oder `.env` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Anon-Public Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Wird für Einladungen benötigt – **niemals im Frontend exponieren** |
| `NEXT_PUBLIC_SITE_URL` | `https://dein-projekt.vercel.app` | Erst nach erstem Deploy eintragen |

**Wichtig:** Für `NEXT_PUBLIC_SITE_URL` setze zuerst die Platzhalter-URL (z.B. `https://reyna-backoffice.vercel.app`) oder lasse sie leer. Nach dem ersten Deploy siehst du die echte URL und kannst sie aktualisieren.

---

## Schritt 4: Ersten Deploy starten

1. Klicke auf **„Deploy“**.
2. Warte, bis der Build durchläuft (ca. 1–2 Minuten).
3. Danach erhältst du eine URL wie `https://reyna-backoffice-xxx.vercel.app`.

---

## Schritt 5: Supabase Redirect-URLs anpassen

Damit Login und Einladungslinks funktionieren:

1. Öffne das **Supabase Dashboard** → dein Projekt.
2. Gehe zu **Authentication** → **URL Configuration**.
3. Trage ein:
   - **Site URL:** `https://DEINE-VERCEL-URL.vercel.app`
   - **Redirect URLs:**  
     `https://DEINE-VERCEL-URL.vercel.app/**`  
     (oder genauer: `https://DEINE-VERCEL-URL.vercel.app/auth/callback`)

4. Klicke auf **Save**.

---

## Schritt 6: `NEXT_PUBLIC_SITE_URL` auf die Live-URL setzen

1. In Vercel: **Projekt** → **Settings** → **Environment Variables**.
2. `NEXT_PUBLIC_SITE_URL` bearbeiten oder neu hinzufügen:
   - Wert: `https://DEINE-VERCEL-URL.vercel.app`
3. **Redeploy** auslösen (Deployments → drei Punkte → Redeploy).

---

## Schritt 7: Testen

1. Öffne deine Vercel-URL im Browser.
2. Logge dich ein (z.B. mit dem Test-Account `lieferant@test.com` / `ReynaTest123!`).
3. Prüfe:
   - Dashboard lädt
   - Bestellungen werden angezeigt
   - Einladungslinks funktionieren (falls du Teams nutzt)

---

## Checkliste

- [ ] GitHub-Repository erstellt und gepusht
- [ ] Vercel-Projekt mit Root Directory `backoffice` erstellt
- [ ] Alle 4 Umgebungsvariablen gesetzt
- [ ] Erster Deploy erfolgreich
- [ ] Supabase Site URL und Redirect URLs angepasst
- [ ] `NEXT_PUBLIC_SITE_URL` auf die Live-URL gesetzt
- [ ] Login und Einladungen getestet

---

## Typische Fehlerquellen

| Problem | Lösung |
|---------|--------|
| Build schlägt fehl | Prüfen: Root Directory = `backoffice`, Node-Version ggf. in `package.json` (`"engines": { "node": "20" }`) |
| Login funktioniert nicht | Redirect URLs in Supabase müssen die exakte Vercel-URL enthalten |
| Einladungslinks leiten auf localhost um | `NEXT_PUBLIC_SITE_URL` muss die Vercel-URL sein |
| Bilder laden nicht | `next.config.ts` erlaubt bereits Supabase Storage – sollte passen |

---

## Custom Domain (optional)

Unter **Vercel** → **Projekt** → **Settings** → **Domains** kannst du eine eigene Domain hinzufügen (z.B. `backoffice.reyna.de`). Anschließend musst du in Supabase die neue URL als Site URL und Redirect URL eintragen.
