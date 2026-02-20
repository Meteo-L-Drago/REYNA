# REYNA – Test-Accounts

## ⚡ Schnellstart

### 1. service_role Key

1. **Supabase Dashboard** → dein Projekt → **Settings** → **API**
2. **service_role** Key kopieren
3. In `.env` eintragen: `SUPABASE_SERVICE_ROLE_KEY=...`

### 2. Skript ausführen

```bash
node scripts/seed-test-accounts.js
```

### 3. Test-Zugang nutzen

**App:** Willkommensbildschirm → **Test-Zugang** → Rolle wählen (Admin, Logistik, Buchhaltung, Vertrieb) → direkt drin, keine Anmeldung nötig.

**Backoffice:** Login-Seite → **Test-Zugang: Buchhaltung** oder **Test-Zugang: Vertrieb** → direkt angemeldet.

---

## Test-Accounts (alle Passwort: ReynaTest123!)

| Rolle      | E-Mail                      | App      | Backoffice |
|-----------|-----------------------------|----------|------------|
| Admin     | lieferant@test.com          | ✓        | ✓ (manuell) |
| Logistik  | test-logistik@reyna.demo    | ✓        | ✗          |
| Buchhaltung | test-buchhaltung@reyna.demo | ✓      | ✓ (Button) |
| Vertrieb  | test-vertrieb@reyna.demo    | ✓        | ✓ (Button) |
| Gastronom | gastronom@test.com          | ✓        | –          |

**Team-Seite:** Als Admin (lieferant@test.com) eingeloggt siehst du alle Teammitglieder (Logistik, Buchhaltung, Vertrieb) im Backoffice unter „Team“.
