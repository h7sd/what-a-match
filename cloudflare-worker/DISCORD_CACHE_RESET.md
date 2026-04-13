# Discord Embed Cache Reset

Discord cached OG-Embeds sehr aggressiv. Hier sind alle Methoden zum Invalidieren:

---

## Methode 1: Discord Bot API (Am Besten)

Wenn du einen Discord Bot hast, kannst du Embeds programmatisch refreshen:

```javascript
// Discord Bot Command
const fetch = require('node-fetch');

async function refreshEmbed(url) {
  const response = await fetch('https://discord.com/api/v10/applications/@me/embed-urls', {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ urls: [url] }),
  });

  if (response.ok) {
    console.log('✅ Embed cache cleared!');
  } else {
    console.error('❌ Failed:', await response.text());
  }
}

// Verwendung
refreshEmbed('https://uservault.cc/username');
```

---

## Methode 2: Query-Parameter (User-Freundlich)

Der Code fügt automatisch Cache-Busting hinzu, aber User können auch manuell Parameter anhängen:

```
Original:     https://uservault.cc/username
Mit Refresh:  https://uservault.cc/username?v=1
Erneut:       https://uservault.cc/username?v=2
```

Jeder neue `?v=` Parameter erstellt einen neuen Cache-Eintrag.

---

## Methode 3: og:updated_time Meta-Tag (Automatisch)

Bereits implementiert in `share/index.ts` (Zeile 94):

```typescript
const updatedTime = new Date().toISOString();
// ...
<meta property="og:updated_time" content="${updatedTime}">
```

Discord respektiert dieses Tag **manchmal**, aber nicht immer zuverlässig.

---

## Methode 4: Discord Developer Portal (Manuell)

1. Gehe zu: https://discord.com/developers/docs/resources/webhook#execute-webhook
2. Nutze die "Unfurl" API um Embeds zu testen
3. Oder nutze externe Tools wie:
   - https://discord.tools/embed-preview
   - https://discohook.org/

---

## Methode 5: Edge Function mit Timestamp (Implementiert)

Der `share` Edge Function fügt bereits automatisch Timestamps an Bilder:

```typescript
const timestamp = Date.now();
const ogImage = baseOgImage.includes('?')
  ? `${baseOgImage}&v=${timestamp}`
  : `${baseOgImage}?v=${timestamp}`;
```

Dies stellt sicher, dass Discord immer das neueste Bild lädt.

---

## Wichtige Hinweise

1. **Discord cached bis zu 24 Stunden** - Selbst mit Cache-Busting kann es dauern
2. **og:url muss einzigartig sein** - Daher nutzen wir den `src` Parameter vom Worker
3. **Bilder werden separat gecached** - Daher die Timestamps an Bild-URLs
4. **Bot-Token erforderlich** - Für die API-Methode brauchst du einen Discord Bot

---

## Empfohlene Lösung für UserVault

Füge einen Discord Bot Command hinzu, der den Embed-Cache automatisch leert:

```javascript
// In deinem Discord Bot (discord-bot/commands.js)
{
  name: 'refresh-embed',
  description: 'Refresh your profile embed in Discord',
  async execute(interaction) {
    const username = interaction.user.username;
    const url = `https://uservault.cc/${username}?v=${Date.now()}`;

    await interaction.reply({
      content: `✅ Share this link to see your updated profile:\n${url}`,
      ephemeral: true
    });
  }
}
```

Dies gibt Usern eine frische URL mit Cache-Busting Parameter.
