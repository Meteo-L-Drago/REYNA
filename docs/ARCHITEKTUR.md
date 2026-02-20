# REYNA – App-Architektur

## Übersicht: Zwei Nutzergruppen

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           REYNA Plattform                                 │
├──────────────────────────────────────┬────────────────────────────────────┤
│   LIEFERANTEN (Großhändler)          │   KUNDEN (Gastronomen)              │
│   • Produkte & Produktlisten pflegen  │   • Restaurant-Infos pflegen        │
│   • Bestellungen erhalten            │   • Bestellungen aufgeben           │
└──────────────────────────────────────┴────────────────────────────────────┘
```

---

## 1. Lieferanten-Seite (Großhändler)

### Verantwortung
- **Produkte** anlegen und verwalten (Name, Preis, Einheit, Kategorie)
- **Produktlisten** verwalten (Kategorien, Sortierung, ggf. Listen-Upload)
- **Bestellungen** einsehen und bearbeiten

### Bestehende Struktur ✓
| Element | Status |
|---------|--------|
| Lieferanten-Profil | ✓ `suppliers` (Firmenname, Adresse, Telefon) |
| Produkte | ✓ `products` (name, price, unit, category, is_available) |
| Produktlisten | ⚠️ Über `category` möglich, noch kein eigener Listen-Begriff |
| Bestellungen | ✓ Lieferanten sehen ihre Bestellungen |

### Optionale Erweiterungen
- **Produktlisten-Upload**: CSV/Excel-Import, um viele Produkte auf einmal anzulegen
- **Produktkategorien**: Feste Kategorien pro Lieferant (z.B. „Fleisch“, „Gemüse“)

---

## 2. Kundenseite (Gastronomen)

### Verantwortung
- **Restaurant-Informationen** hinterlegen (Name, Adresse, Kontakt)
- Lieferanten durchsuchen
- **Warenkorb** befüllen
- **Bestellungen** aufgeben (Sofortzahlung oder auf Rechnung)

### Bestehende Struktur ✓ / ⚠️
| Element | Status |
|---------|--------|
| Benutzer-Konto | ✓ `profiles` (E-Mail, Name) |
| Restaurant-Infos | ❌ **fehlt** – Adresse, Name, Telefon etc. |
| Lieferanten-Suche | ✓ Liste aller Lieferanten |
| Produktkatalog | ✓ Pro Lieferant |
| Warenkorb | ✓ In der App (CartContext) |
| Bestellungen | ✓ `orders` + `order_items` |

### Zu ergänzen
- **Tabelle `restaurants`** (bzw. `gastronom_profiles`):  
  - Restaurant-Name  
  - Lieferadresse (Straße, PLZ, Ort)  
  - Rechnungsadresse (optional, kann gleich sein)  
  - Telefon  
  - Verknüpfung zum Gastronomen (`gastronom_id`)

---

## 3. Datenmodell (Aktuell + Vorschlag)

```
auth.users
    │
    ├──► profiles (role: gastronom | lieferant)
    │
    ├──► suppliers (nur bei role=lieferant)
    │         │
    │         └──► products (Produkte pro Lieferant)
    │
    └──► restaurants (NEU – nur bei role=gastronom)
              │
              └──► Lieferadresse, Name, Telefon etc.

orders
    ├── gastronom_id → auth.users
    ├── supplier_id  → suppliers
    └── order_items  → products
```

---

## 4. Nächste Schritte

1. **Migration 002**: Tabelle `restaurants` anlegen und verknüpfen  
2. **UI-Kundenseite**: Bildschirm für Restaurant-Infos (Profil/Adresse)  
3. **Lieferanten**: ggf. CSV-Upload für Produktlisten (später)

---

## 5. Bestellablauf (Bestätigt)

```
Kunde wählt Lieferant → Produkte durchsuchen → Menge wählen → In Warenkorb
→ Zur Kasse → Zahlungsart (Sofort / Rechnung) → Bestellung aufgeben
→ Lieferant erhält Bestellung
```
