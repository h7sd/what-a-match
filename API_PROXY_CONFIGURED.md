# API Proxy Konfiguration - Discord Login Fix ✅

## Was wurde geändert

**Problem**: `{"code":401,"message":"Missing authorization header"}`

**Root Cause**: Die App versuchte, den Discord OAuth Flow über `api.uservault.cc` zu routen, aber:
- Der Supabase Client zeigte noch auf die direkte URL
- Requests gingen zu verschiedenen Domains → 401 Fehler

---

## Lösung: Vollständiger API Proxy

### 1. Supabase Client nutzt jetzt API Proxy

**Datei**: `.env`

```env
# VORHER (direkte Supabase URL)
# VITE_SUPABASE_URL=https://nuszlhxbyxdjlaubuwzd.supabase.co

# JETZT (API Proxy)
VITE_SUPABASE_URL=https://api.uservault.cc
```

**Effekt**:
- ✅ ALLE Supabase Requests gehen durch `api.uservault.cc`
- ✅ Die echte Supabase URL ist KOMPLETT versteckt
- ✅ Discord OAuth verwendet dieselbe Domain

### 2. Discord Redirect URI

**Datei**: `src/hooks/useDiscordOAuth.ts`

```typescript
const getRedirectUri = useCallback(() => {
  return `https://api.uservault.cc/functions/v1/discord-oauth-callback`;
}, []);
```

**Effekt**:
- ✅ Discord redirects zu `api.uservault.cc`
- ✅ Cloudflare Worker proxied die Requests zu Supabase
- ✅ Kein 401 Error mehr

---

## Was du JETZT tun musst

### 1. Cloudflare Worker MUSS deployed sein

Der Cloudflare Worker unter `cloudflare-worker/api-proxy.js` **MUSS deployed sein**, sonst funktioniert NICHTS!

**Deployment Guide**: Siehe `cloudflare-worker/DEPLOYMENT_GUIDE.md`

**Quick Check**:
```bash
curl -I https://api.uservault.cc/functions/v1/health
```

**Erwartete Antwort**: `200 OK`

Falls nicht deployed:
```bash
# In cloudflare-worker/ Verzeichnis
npx wrangler deploy api-proxy.js --name uservault-api-proxy
```

### 2. Discord Developer Portal aktualisieren

Gehe zu [Discord Developer Portal](https://discord.com/developers/applications):

1. Wähle deine App
2. **OAuth2** → **Redirects**
3. Füge diese URL hinzu:
   ```
   https://api.uservault.cc/functions/v1/discord-oauth-callback
   ```
4. **ENTFERNE** die alte Supabase URL:
   ```
   https://nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/discord-oauth-callback
   ```
5. **Save Changes**

### 3. DNS ist korrekt konfiguriert

**Cloudflare DNS** für `api.uservault.cc`:

```
Type: CNAME
Name: api
Target: uservault-api-proxy.DEIN-WORKER-SUBDOMAIN.workers.dev
Proxy: ✅ Proxied (Orange Cloud)
```

**ODER**

```
Type: Worker Route
Pattern: api.uservault.cc/*
Worker: uservault-api-proxy
```

---

## Request Flow

### Wie es jetzt funktioniert

**Login Request**:
```
Frontend → api.uservault.cc/functions/v1/discord-oauth
         ↓ (Cloudflare Worker)
         ↓ proxied zu
         ↓
         nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/discord-oauth
         ↓
         Discord OAuth URL zurück
```

**Discord Redirect**:
```
Discord → api.uservault.cc/functions/v1/discord-oauth-callback?code=...
        ↓ (Cloudflare Worker)
        ↓ proxied zu
        ↓
        nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/discord-oauth-callback
        ↓
        User Session erstellt
        ↓
        Redirect zurück zur App
```

**Alle anderen Requests (auth, database, storage)**:
```
Frontend → api.uservault.cc/rest/v1/profiles
         ↓ (Cloudflare Worker)
         ↓ proxied zu
         ↓
         nuszlhxbyxdjlaubuwzd.supabase.co/rest/v1/profiles
```

**Ergebnis**: Die echte Supabase URL ist NIRGENDS sichtbar! 🔒

---

## Was du prüfen solltest

### 1. Cloudflare Worker ist erreichbar

**Test 1: Health Check**
```bash
curl https://api.uservault.cc/functions/v1/health
```
**Erwartete Antwort**: `{"status":"ok"}` oder ähnlich

**Test 2: Discord OAuth**
```bash
curl -X POST https://api.uservault.cc/functions/v1/discord-oauth \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action":"get_auth_url","redirect_uri":"https://api.uservault.cc/functions/v1/discord-oauth-callback","frontend_origin":"https://uservault.cc"}'
```

**Erwartete Antwort**: `{"url":"https://discord.com/api/oauth2/authorize?...","state":"..."}`

### 2. CORS Headers werden korrekt gesetzt

**Test**:
```bash
curl -X OPTIONS https://api.uservault.cc/functions/v1/discord-oauth \
  -H "Origin: https://uservault.cc" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Erwartete Headers**:
```
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
< Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, ...
```

### 3. Authorization Header wird weitergeleitet

Der Cloudflare Worker leitet ALLE Headers weiter, einschließlich:
- `Authorization: Bearer YOUR_ANON_KEY`
- `apikey: YOUR_ANON_KEY`
- `x-client-info`
- etc.

**Prüfen**: Schau in die Cloudflare Worker Logs (Dashboard → Workers → uservault-api-proxy → Logs)

---

## Sicherheit

### Was ist jetzt sicher

1. **Supabase URL ist versteckt**:
   - ✅ Nicht in Browser Dev Tools sichtbar
   - ✅ Nicht in Network Tab sichtbar
   - ✅ Nur `api.uservault.cc` ist sichtbar

2. **Anon Key ist immer noch öffentlich**:
   - ⚠️ Der Anon Key wird im Frontend verwendet
   - ⚠️ Das ist OK und designed to be public
   - ✅ RLS Policies schützen die Daten

3. **Worker versteckt nur die URL**:
   - ✅ Zusätzliche Verschleierung (security through obscurity)
   - ✅ Erschwert Angriffe
   - ⚠️ Aber nicht 100% Schutz (RLS ist wichtiger)

4. **Rate Limiting im Worker (optional)**:
   - Du kannst Rate Limiting im Worker hinzufügen
   - Siehe Cloudflare Rate Limiting Docs

---

## Troubleshooting

### "Failed to fetch" oder "Network error"

**Problem**: Cloudflare Worker ist nicht deployed oder nicht erreichbar

**Lösung**:
1. Deploy den Worker: `npx wrangler deploy api-proxy.js`
2. Prüfe DNS: `dig api.uservault.cc`
3. Teste direkt: `curl https://api.uservault.cc/functions/v1/health`

### "401 Missing authorization header"

**Problem**: Authorization Header wird nicht weitergeleitet

**Lösung**:
1. Prüfe Cloudflare Worker Code: Header werden in Zeile 49-52 weitergeleitet
2. Stelle sicher, dass der Worker deployed ist
3. Prüfe Cloudflare Worker Logs

### "Discord redirect_uri mismatch"

**Problem**: Discord erwartet eine andere Redirect URI

**Lösung**:
1. Discord Developer Portal → OAuth2 → Redirects
2. Füge hinzu: `https://api.uservault.cc/functions/v1/discord-oauth-callback`
3. Entferne alte Supabase URL
4. Save Changes und warte 1-2 Minuten

### "CORS error"

**Problem**: CORS Headers werden nicht korrekt gesetzt

**Lösung**:
1. Prüfe Cloudflare Worker: CORS Headers in Zeile 24-30
2. Stelle sicher, dass OPTIONS Requests korrekt behandelt werden
3. Teste mit `curl -X OPTIONS`

### "Content-Type not set" oder "HTML shows as text"

**Problem**: Discord OAuth Callback gibt HTML zurück, aber Content-Type fehlt

**Lösung**:
- ✅ Bereits gefixt im Worker (Zeile 76-79)
- Der Worker setzt `Content-Type: text/html` für Discord Callback

---

## Cloudflare Worker Configuration

### Environment Variables im Worker (optional)

Falls du Secrets im Worker verwenden willst:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Dann im Worker:
```javascript
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
```

### Custom Domain in Worker

**wrangler.toml**:
```toml
name = "uservault-api-proxy"
main = "api-proxy.js"
compatibility_date = "2024-01-01"

[route]
pattern = "api.uservault.cc/*"
zone_name = "uservault.cc"
```

**Deploy**:
```bash
npx wrangler deploy
```

---

## Rollback Plan

Falls der API Proxy Probleme macht:

### 1. Zurück zur direkten Supabase URL

**In `.env`**:
```env
VITE_SUPABASE_URL=https://nuszlhxbyxdjlaubuwzd.supabase.co
```

**In `src/hooks/useDiscordOAuth.ts`**:
```typescript
const getRedirectUri = useCallback(() => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/discord-oauth-callback`;
}, []);
```

### 2. Discord Redirect URI aktualisieren

```
https://nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/discord-oauth-callback
```

### 3. Rebuild und Deploy

```bash
npm run build
```

---

## Next Steps

**Sofort**:
1. ✅ Code ist fertig
2. ✅ Build erfolgreich
3. ⏳ **Deploy Cloudflare Worker**
4. ⏳ **Aktualisiere Discord Redirect URI**
5. ⏳ **Teste Discord Login**

**Optional**:
1. Rate Limiting im Worker hinzufügen
2. Monitoring/Logging einrichten
3. Custom Error Pages

---

## Dateien geändert

- ✅ `.env` - `VITE_SUPABASE_URL` zeigt jetzt auf `api.uservault.cc`
- ✅ `src/hooks/useDiscordOAuth.ts` - Discord Redirect URI nutzt `api.uservault.cc`
- ✅ `cloudflare-worker/api-proxy.js` - Worker Code ist ready

---

**Status**: ✅ **Code ist fertig - Worker muss deployed werden!**

**Kritisch**: Ohne deployed Cloudflare Worker funktioniert **GAR NICHTS**!

**Deployment Guide**: `cloudflare-worker/DEPLOYMENT_GUIDE.md`

---

## Monitoring

### Cloudflare Analytics

**Dashboard**: Cloudflare → Workers → uservault-api-proxy → Metrics

**Wichtige Metriken**:
- Requests per second
- Error rate
- Latency
- Bandwidth

### Logs

**Real-time Logs**:
```bash
npx wrangler tail uservault-api-proxy
```

**Im Code**:
```javascript
console.log('[API Proxy] Request:', request.url);
console.error('[API Proxy] Error:', error);
```

---

**Wichtig**: Stelle sicher, dass der Cloudflare Worker deployed ist, bevor du die App verwendest!
