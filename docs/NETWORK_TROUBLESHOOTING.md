# REYNA – "Network request failed" beheben

## Checkliste

### 1. Supabase-Projekt prüfen
- Öffne **[Supabase Dashboard](https://supabase.com/dashboard)** → dein Projekt
- Steht oben **"Project paused"**? → Klicke **"Restore project"**
- Free-Tier-Projekte werden nach Inaktivität pausiert – das führt zu Netzwerkfehlern

### 2. Im Browser testen
- Starte die App mit `npx expo start --web`
- Öffne http://localhost:8081 im Browser
- Teste Login dort
- **Funktioniert im Browser?** → Problem liegt vermutlich am iOS-Simulator bzw. Gerät
- **Funktioniert auch im Browser nicht?** → Supabase oder .env prüfen

### 3. .env und Neustart
- Prüfe, dass `.env` im Projektroot liegt mit:
  ```
  EXPO_PUBLIC_SUPABASE_URL=https://iqyrimviyygqtqcpngjvh.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=dein-key
  ```
- App komplett neu starten:
  ```bash
  npx expo start --clear
  ```
- Im Simulator: **Device** → **Erase All Content and Settings**, dann erneut starten

### 4. Netzwerk
- Simulator/Gerät hat Internet (z.B. Safari öffnen und Seite laden)
- Kein VPN oder Proxy, der supabase.co blockiert
- Keine Firewall auf dem Mac, die den Simulator blockiert

### 5. Anderes Gerät
- Test auf echtem iPhone mit Expo Go (QR-Code scannen)
- Oder Test im Webmodus
