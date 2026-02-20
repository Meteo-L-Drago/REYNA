# Einladungs-Link funktioniert nicht – Supabase konfigurieren

Wenn der Einladungs-Link in der E-Mail nicht funktioniert oder sich nichts öffnet:

## 1. Redirect-URLs in Supabase eintragen

1. **Supabase Dashboard** öffnen → dein Projekt
2. **Authentication** → **URL Configuration**
3. Bei **Redirect URLs** eintragen:
   - `http://localhost:3000/auth/callback` (für lokale Entwicklung)
   - `https://deine-domain.de/auth/callback` (für Produktion)
4. **Site URL** setzen (z.B. `http://localhost:3000` oder deine Produktions-URL)

## 2. Einladungs-E-Mail-Template anpassen (optional)

Standardmäßig geht der Link zu Supabase. Damit der Link direkt ins Backoffice führt:

1. **Authentication** → **Email Templates** → **Invite user**
2. Im HTML-Link `{{ .ConfirmationURL }}` durch diese URL ersetzen:

```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite
```

**Beispiel für den gesamten Link-Bereich:**
```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite">
  Einladung annehmen
</a>
```

3. Speichern

## 3. Hinweis zu E-Mail-Clients

- Einige Anbieter (z.B. Microsoft Safe Links) klicken Links beim Vorschau-Laden – der Token kann dadurch verbraucht werden.
- In diesem Fall: Link kopieren und in einem neuen Tab einfügen, oder den Link im Browser manuell aufrufen.
