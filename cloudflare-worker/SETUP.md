# Cloudflare Worker Setup für Discord Embeds

## Problem
Discord cached OG-Tags und die statische Seite kann keine dynamischen OG-Tags für Bots generieren.

## Lösung
Worker fängt Bot-Requests ab und generiert dynamisches HTML mit korrekten OG-Tags.

---

## Setup Option 1: Cloudflare Pages mit Functions (EMPFOHLEN)

### Vorteile:
- Einfachster Setup
- Keine extra Worker-Konfiguration nötig
- Automatisches Deployment

### Schritte:

1. **Build dein Projekt:**
   ```bash
   npm run build
   cp public/_worker.js dist/_worker.js
   ```

2. **Deploy zu Cloudflare Pages:**
   - Gehe zu: https://dash.cloudflare.com → Pages
   - "Create a project" → Connect to Git
   - Build command: `npm run build && cp public/_worker.js dist/_worker.js`
   - Output directory: `dist`
   - Deploy

3. **Custom Domain hinzufügen:**
   - Im Pages Project → Custom domains
   - Füge `uservault.cc` hinzu
   - DNS wird automatisch konfiguriert

4. **Fertig!** Der `_worker.js` wird automatisch als Edge Function deployed.

---

## Setup Option 2: Standalone Worker (Aktuelles Setup)

### Voraussetzungen:
- Pages Deployment für statische Files
- Separater Worker für Bot-Detection

### Schritte:

1. **Deploy statische Files zu Cloudflare Pages:**
   - Build: `npm run build`
   - Deploy zu Pages
   - Notiere die Pages-URL (z.B. `uservault-abc123.pages.dev`)

2. **Erstelle Worker:**
   - Gehe zu: https://dash.cloudflare.com → Workers & Pages
   - "Create Worker"
   - Kopiere Code aus `cloudflare-worker/og-proxy.js`
   - Deploy

3. **Konfiguriere Worker Environment Variable:**
   - Im Worker → Settings → Variables
   - Füge hinzu:
     - Name: `ORIGIN_URL`
     - Value: `https://uservault-abc123.pages.dev` (deine Pages URL)

4. **Füge Worker Route hinzu:**
   - Im Worker → Triggers → Add Route
   - Route: `uservault.cc/*`
   - Zone: `uservault.cc`

5. **Teste:**
   ```bash
   curl -I -A "Mozilla/5.0 (compatible; Discordbot/2.0)" https://uservault.cc/n
   ```
   Sollte Header zeigen: `X-OG-Worker: active-generated`

---

## Discord Cache leeren

Nach dem Deployment musst du Discord's Cache leeren:

1. **Methode 1 - Discord API:**
   ```bash
   curl -X POST https://discord.com/api/v10/applications/{APP_ID}/commands/refresh \
     -H "Authorization: Bot {BOT_TOKEN}"
   ```

2. **Methode 2 - URL Parameter:**
   Füge `?v=1` zum Link hinzu: `https://uservault.cc/n?v=1`

3. **Methode 3 - Neuen Link teilen:**
   Discord cached nach URL, also ändere temporär den Username oder nutze den direkten Share-Link.

---

## Debugging

### Check ob Worker aktiv ist:
```bash
curl -I https://uservault.cc/test123
```
Sollte Header zeigen: `X-OG-Worker: active`

### Check Bot-Detection:
```bash
curl -A "Mozilla/5.0 (compatible; Discordbot/2.0)" https://uservault.cc/n
```
Sollte HTML mit `<meta property="og:title" content="nico">` zeigen

### Check Edge Function direkt:
```bash
curl https://nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/share?u=n
```
Sollte HTML mit korrekten OG-Tags zurückgeben

### Worker Logs anschauen:
- Worker Dashboard → Logs
- Suche nach `[OG]` Prefix

---

## Troubleshooting

### "X-OG-Worker" Header nicht sichtbar
- Worker ist nicht deployed oder Route ist nicht konfiguriert
- Check Worker Triggers

### Worker zeigt "active" aber keine generierten OG-Tags
- Bot-Detection funktioniert nicht
- Teste mit `?__bot=1` Parameter: `https://uservault.cc/n?__bot=1`

### Endlosschleife / Timeout
- `ORIGIN_URL` zeigt auf `uservault.cc` statt auf Pages-URL
- Check Environment Variable

### OG-Tags noch immer falsch in Discord
- Discord Cache - nutze eine der Cache-Clear Methoden oben
- Warte 24h oder ändere URL
