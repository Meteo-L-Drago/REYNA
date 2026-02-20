# REYNA – Datenbank-Setup

Die App nutzt **Supabase** als professionelle Backend-Lösung mit:

- **PostgreSQL** – strukturierte Daten
- **Auth** – Benutzerverwaltung
- **Storage** – Bilder (Produkte, Avatare)
- **RLS** – Row Level Security für Zugriffskontrolle

## Einmalige Einrichtung

### 1. Storage Buckets erstellen

```bash
node scripts/setup-storage.js
```

Erstellt die Buckets `product-images` und `avatars` in Supabase Storage.

### 2. Migration ausführen

Im **Supabase Dashboard** → **SQL Editor** → **New query**:

1. **005_storage_and_schema.sql** – enthält:
   - Storage-RLS-Policies für Produktbilder und Avatare
   - Schema-Erweiterungen: `profiles.avatar_url`, `suppliers.logo_url`
   - Tabelle `product_categories` mit vordefinierten Kategorien

2. **006_realtime_and_views.sql** – für Backoffice:
   - Realtime für Tabelle `orders` (Echtzeit-Updates bei neuen Bestellungen)

3. **007_backoffice_features.sql** – für Produkte, Rechnungen, Kataloge:
   - Lieferanten können Bestellstatus ändern
   - Lieferanten können Restaurants ihrer Kunden sehen (Rechnungsdruck)
   - Tabelle `supplier_catalogs` + Storage für PDF-Kataloge

4. **008_teams_and_roles.sql** – für Team-System:
   - Teams (Logistik, Buchhaltung, Vertrieb)
   - Teammitglieder + Teamchefs
   - Kundenzuordnung für Vertrieb
   - Rollenbasierte Sichtbarkeit (Buchhaltung sieht keine Lieferstatus)

5. **009_team_invite_improvements.sql** – für Einladungs-Flow:
   - Spalte `personal_id` in supplier_team_members (z.B. MIT-001)
   - Spalte `invitation_status` (pending/accepted) für Einladungs-Status

6. **010_logistik_pack_und_rls.sql** – für Logistik-Versand in der App:
   - `order_items.is_packed` – Positionen abhaken
   - RLS: Teammitglieder lesen order_items, Logistik/Teamchefs updaten
   - Realtime für orders + order_items (Live-Verfolgung für Chefs)

7. **011_fix_rls_recursion.sql** – behebt „infinite recursion“ in supplier_team_members-Policies

## Aktuelles Datenmodell

| Tabelle | Beschreibung |
|---------|-------------|
| `profiles` | User-Profil (Name, Rolle, E-Mail, Avatar) |
| `suppliers` | Lieferanten (Firma, Adresse, Logo) |
| `restaurants` | Gastronom-Betriebe (Name, Adresse) |
| `products` | Produkte (Name, Preis, Bild, Kategorie) |
| `orders` | Bestellungen |
| `order_items` | Bestellpositionen |
| `product_categories` | Kategorien für Produkte |

## Storage-Struktur

- **product-images/** – Produktbilder (max. 5 MB, JPEG/PNG/WebP)
  - Ordner: `{supplier_id}/{timestamp}.jpg`
- **avatars/** – Benutzer-Avatare (max. 2 MB)
  - Ordner: `{user_id}/avatar.jpg`

## Benötigte Berechtigungen

- **Lieferanten** können in `product-images/{supplier_id}/` hochladen
- **Alle** können Produktbilder und Avatare lesen
