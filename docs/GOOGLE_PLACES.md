# Adresssuche (Google Places API)

Die Adresssuche im Gastronom-Onboarding nutzt die **Google Places API** für Adressvorschläge während der Eingabe. Ausgewählte Adressen werden strukturiert (Straße, PLZ, Stadt, Land) in der Datenbank gespeichert.

## Google Places API (empfohlen)

1. In der [Google Cloud Console](https://console.cloud.google.com/) ein Projekt anlegen
2. **Places API** und **Places API (New)** aktivieren
3. API-Key erstellen (API-Einschränkungen für Places API)
4. In `.env` hinzufügen:
   ```
   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=dein-api-key
   ```

### Gespeicherte Daten

Bei Auswahl einer Adresse werden automatisch extrahiert:
- `street` – Straße und Hausnummer
- `postal_code` – Postleitzahl
- `city` – Stadt
- `country` – Land
- `formatted` – Vollständige Adresse zur Anzeige

## Apple Maps

Für native Apple-Kartenintegration wäre ein Custom Development Build nötig (kein Expo Go). Google Places funktioniert plattformübergreifend auf iOS und Android.

## Ohne API-Key

Ohne API-Key bleibt ein einfaches Textfeld – die Adresse kann manuell eingegeben werden, wird aber weniger präzise gespeichert.
