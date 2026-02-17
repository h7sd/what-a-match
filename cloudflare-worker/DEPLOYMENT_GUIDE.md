# Cloudflare Worker Deployment Guide - API Proxy

## Warum brauchen wir den API Proxy?

Der API Proxy **versteckt die echte Supabase URL** aus:
- Browser Dev Tools
- Network Requests
- Source Code

**Ohne Proxy**: `https://nuszlhxbyxdjlaubuwzd.supabase.co` ist überall sichtbar

**Mit Proxy**: `https://api.uservault.cc` → leitet intern weiter

---

## Schritt 1: DNS Setup

### Option A: Subdomain (empfohlen)

Erstelle einen **CNAME Record** in Cloudflare DNS:

```
Type: CNAME
Name: api
Content: uservault.cc (oder deine Worker URL)
Proxy status: Proxied (orange cloud)
TTL: Auto
```

**Ergebnis**: `api.uservault.cc` zeigt auf deinen Worker

### Option B: Path

Alternativ kannst du auch `uservault.cc/api/*` verwenden (erfordert Route-Konfiguration).

---

## Schritt 2: Cloudflare Worker Erstellen

1. Gehe zu [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Wähle dein Konto
3. **Workers & Pages** → **Create Application** → **Create Worker**
4. Name: `uservault-api-proxy`
5. **Deploy**

---

## Schritt 3: Worker Code Deployen

### Via Dashboard (Web UI)

1. Öffne deinen Worker
2. **Quick Edit**
3. Lösche den Default Code
4. Kopiere **gesamten Inhalt** von `api-proxy.js` rein
5. **Save and Deploy**

### Via CLI (Wrangler)

```bash
# Install Wrangler (falls noch nicht installiert)
npm install -g wrangler

# Login zu Cloudflare
wrangler login

# Im Projektverzeichnis
cd cloudflare-worker

# Deploy
wrangler deploy api-proxy.js --name uservault-api-proxy
```

---

## Schritt 4: Route Konfigurieren

### Im Worker Dashboard:

1. Öffne deinen Worker
2. **Triggers** Tab
3. **Add Route**
4. **Route Pattern**: `api.uservault.cc/*`
5. **Zone**: `uservault.cc`
6. **Save**

### Via wrangler.toml (alternativ):

Erstelle `wrangler.toml`:

```toml
name = "uservault-api-proxy"
main = "api-proxy.js"
compatibility_date = "2024-01-01"

[env.production]
routes = [
  { pattern = "api.uservault.cc/*", zone_name = "uservault.cc" }
]
```

Dann deploy mit:
```bash
wrangler deploy
```

---

## Schritt 5: Worker Testen

### Test 1: Health Check

```bash
curl https://api.uservault.cc/rest/v1/
```

**Erwartete Response**: Supabase REST API Info (ohne die echte URL zu sehen)

### Test 2: Discord OAuth Callback

```bash
curl -I https://api.uservault.cc/functions/v1/discord-oauth-callback
```

**Erwartete Response**: HTTP 200/400 (nicht 1016 DNS Error!)

### Test 3: Edge Function

```bash
curl -X POST https://api.uservault.cc/functions/v1/discord-oauth \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action":"get_auth_url","redirect_uri":"https://api.uservault.cc/functions/v1/discord-oauth-callback"}'
```

**Erwartete Response**: Discord OAuth URL

---

## Schritt 6: Environment Variables Anpassen

Sobald der Worker deployed und funktioniert:

### In `.env`:

**Vorher**:
```env
VITE_SUPABASE_URL=https://nuszlhxbyxdjlaubuwzd.supabase.co
```

**Nachher**:
```env
VITE_SUPABASE_URL=https://api.uservault.cc
```

**WICHTIG**: Die `VITE_SUPABASE_ANON_KEY` bleibt gleich!

### Nach Änderung:

```bash
# Rebuild
npm run build

# Dev Server neustarten (falls läuft)
# npm run dev wird automatisch neugestartet
```

---

## Schritt 7: Discord Developer Portal Update

Gehe zu [Discord Developer Portal](https://discord.com/developers/applications):

1. Wähle deine App
2. **OAuth2** → **Redirects**
3. Füge hinzu:
   ```
   https://api.uservault.cc/functions/v1/discord-oauth-callback
   ```
4. **Save Changes**

**WICHTIG**: Die URL muss **exakt** so sein!

---

## Schritt 8: Testen

### Login mit Discord

1. Besuche `https://uservault.cc/auth`
2. Klicke **"Continue with Discord"**
3. Authorisiere auf Discord
4. ✅ Sollte zurück zu deiner App redirecten und einloggen

### Dev Tools Prüfen

1. **F12** → **Network Tab**
2. Login mit Discord
3. Prüfe Requests:
   - ✅ Sollte `api.uservault.cc` zeigen
   - ❌ Sollte **NICHT** `nuszlhxbyxdjlaubuwzd.supabase.co` zeigen

---

## Troubleshooting

### Error 1016 - Origin DNS error

**Problem**: DNS ist nicht richtig konfiguriert

**Lösung**:
1. Prüfe DNS-Record in Cloudflare
2. Stelle sicher, dass CNAME auf Worker zeigt
3. Warte 5-10 Minuten für DNS-Propagierung

### Error 522 - Connection timed out

**Problem**: Worker ist nicht deployed oder Route falsch

**Lösung**:
1. Prüfe Worker Status im Dashboard
2. Prüfe Route-Konfiguration
3. Deploy Worker neu

### Error 404 - Not Found

**Problem**: Route Pattern stimmt nicht

**Lösung**:
1. Prüfe Route: muss `api.uservault.cc/*` sein
2. Prüfe Zone: muss `uservault.cc` sein

### CORS Errors

**Problem**: Worker sendet keine CORS Headers

**Lösung**:
1. Prüfe `corsHeaders` im Worker Code
2. Stelle sicher, dass alle Responses CORS Headers haben
3. Deploy Worker neu

### Discord "Redirect URI mismatch"

**Problem**: URL in Discord App stimmt nicht mit Code überein

**Lösung**:
1. Discord Developer Portal: Prüfe exakte URL
2. Muss sein: `https://api.uservault.cc/functions/v1/discord-oauth-callback`
3. Keine Trailing Slashes!

---

## Monitoring

### Worker Logs ansehen

1. Cloudflare Dashboard → Workers
2. Wähle deinen Worker
3. **Logs** Tab
4. Sieh Live-Requests

### Metrics

- **Requests/min**: Im Dashboard sichtbar
- **Errors**: Prüfe error rate
- **Latency**: Sollte <100ms sein

---

## Security Checklist

✅ **Worker deployed und erreichbar**
✅ **DNS richtig konfiguriert**
✅ **CORS Headers gesetzt**
✅ **Discord Redirect URI updated**
✅ **Frontend .env auf api.uservault.cc**
✅ **Health Checks erfolgreich**
✅ **Keine Supabase URL in Dev Tools sichtbar**

---

## Kosten

**Cloudflare Workers Free Plan**:
- ✅ 100,000 Requests/Tag (kostenlos)
- ✅ Unbegrenzte Requests ($0.50 pro Million darüber)

**Für UserVault**: Free Plan reicht völlig aus!

---

## Optional: Custom Domain für Worker

Falls du eine komplett separate Domain willst:

1. **Workers** → **Settings** → **Triggers**
2. **Custom Domains**
3. Add: `api.yourdomain.com`
4. Cloudflare konfiguriert DNS automatisch

**Vorteil**: Noch cleaner, komplett unabhängig

---

## Nächste Schritte

Nach erfolgreichem Deployment:

1. ✅ Discord Login testen
2. ✅ Alle API Calls testen
3. ✅ Dev Tools prüfen (keine Supabase URL sichtbar)
4. ✅ Production Build erstellen
5. ✅ Deployen

---

## Support

Bei Problemen:
1. Prüfe Worker Logs
2. Prüfe Cloudflare DNS
3. Teste mit `curl` Commands oben
4. Prüfe Discord Developer Portal

---

**Status**: Bereit für Deployment!
**Geschätzte Zeit**: 15-30 Minuten
**Schwierigkeit**: Mittel
**Kosten**: Kostenlos (Free Plan)
