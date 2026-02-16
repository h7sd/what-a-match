# Changelog System - Discord Bot Integration

## Overview
Das Changelog-System ist vollständig implementiert und nutzt Supabase Edge Functions + PostgreSQL Datenbank.

**Wichtig**: Changelogs können detailliert sein, aber dürfen KEINE sensiblen Informationen enthalten!

---

## API Endpoint

### Base URL
```
https://nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/get-changelogs
```

### Method
`GET` (keine Authentication erforderlich)

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Anzahl der Changelogs (max empfohlen: 50) |
| `category` | string | - | Filter: `feature`, `bugfix`, `improvement`, `security` |
| `major_only` | boolean | false | Nur Major Updates (`true`/`false`) |

### Example Requests

**Alle Changelogs (letzte 10):**
```bash
GET https://nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/get-changelogs
```

**Letzte 20 Feature Updates:**
```bash
GET https://nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/get-changelogs?limit=20&category=feature
```

**Nur Major Updates:**
```bash
GET https://nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/get-changelogs?major_only=true
```

---

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "changelogs": [
    {
      "id": "uuid-string",
      "version": "v1.2.3",
      "title": "New Feature: Badge System",
      "description": "Added a new badge system with custom icons and colors",
      "category": "feature",
      "is_major": true,
      "published_at": "2024-01-15T14:30:00.000Z",
      "created_at": "2024-01-15T14:25:00.000Z"
    },
    {
      "id": "another-uuid",
      "version": "v1.2.2",
      "title": "Bug Fix: Profile Upload",
      "description": "Fixed an issue where profile pictures would not upload correctly",
      "category": "bugfix",
      "is_major": false,
      "published_at": "2024-01-14T10:00:00.000Z",
      "created_at": "2024-01-14T09:55:00.000Z"
    }
  ],
  "count": 2
}
```

### Error Response (500)
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Changelog Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (uuid) | Unique identifier - **Use this to prevent duplicates** |
| `version` | string | Version number (e.g., "v1.2.3") |
| `title` | string | Short title of the update |
| `description` | string | Detailed description (can be multi-line) |
| `category` | string | `feature`, `bugfix`, `improvement`, `security` |
| `is_major` | boolean | Whether this is a major update |
| `published_at` | string (ISO 8601) | When the changelog was published |
| `created_at` | string (ISO 8601) | When the changelog was created |

---

## Category Types & Icons

Recommended Discord Emoji mapping:

| Category | Icon | Description |
|----------|------|-------------|
| `feature` | ✨ oder 🎉 | New features |
| `bugfix` | 🔧 oder 🐛 | Bug fixes |
| `improvement` | 🚀 oder ⚡ | Performance/UX improvements |
| `security` | 🔒 oder 🛡️ | Security updates |

---

## Discord Bot Implementation

### Node.js Example with discord.js

```javascript
const fetch = require('node-fetch');
const { EmbedBuilder } = require('discord.js');

const CHANGELOG_API = 'https://nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/get-changelogs';
const CHANGELOG_CHANNEL_ID = '1473017918210969803';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 Minuten

// Set to track sent changelog IDs (in-memory, resets on bot restart)
const sentChangelogs = new Set();

// Category colors
const categoryColors = {
  feature: 0x3B82F6,    // Blue
  bugfix: 0xEF4444,     // Red
  improvement: 0x10B981, // Green
  security: 0xF59E0B    // Yellow
};

// Category emojis
const categoryEmojis = {
  feature: '✨',
  bugfix: '🔧',
  improvement: '🚀',
  security: '🔒'
};

async function fetchChangelogs(limit = 10) {
  try {
    const response = await fetch(`${CHANGELOG_API}?limit=${limit}`);
    const data = await response.json();

    if (data.success) {
      return data.changelogs;
    } else {
      console.error('Failed to fetch changelogs:', data.error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching changelogs:', error);
    return [];
  }
}

async function sendChangelogToDiscord(client, changelog) {
  try {
    const channel = await client.channels.fetch(CHANGELOG_CHANNEL_ID);
    if (!channel) {
      console.error('Changelog channel not found');
      return;
    }

    const emoji = categoryEmojis[changelog.category] || '📢';
    const color = categoryColors[changelog.category] || 0x5865F2;

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} ${changelog.version} - ${changelog.title}`)
      .setDescription(changelog.description)
      .setColor(color)
      .addFields(
        { name: 'Category', value: changelog.category, inline: true },
        { name: 'Type', value: changelog.is_major ? '🌟 Major Update' : 'Minor Update', inline: true }
      )
      .setTimestamp(new Date(changelog.published_at))
      .setFooter({ text: 'UserVault Changelog System' });

    await channel.send({ embeds: [embed] });
    console.log(`✅ Sent changelog: ${changelog.version} - ${changelog.title}`);
  } catch (error) {
    console.error('Error sending changelog:', error);
  }
}

async function checkForNewChangelogs(client) {
  console.log('🔄 Checking for new changelogs...');

  const changelogs = await fetchChangelogs(20); // Check last 20

  let newCount = 0;
  for (const changelog of changelogs) {
    // Skip if already sent
    if (sentChangelogs.has(changelog.id)) {
      continue;
    }

    // Send to Discord
    await sendChangelogToDiscord(client, changelog);

    // Mark as sent
    sentChangelogs.add(changelog.id);
    newCount++;

    // Wait 1 second between messages to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (newCount > 0) {
    console.log(`✨ Sent ${newCount} new changelog(s)`);
  } else {
    console.log('✅ No new changelogs');
  }
}

// Start polling when bot is ready
client.once('ready', async () => {
  console.log(`🤖 Bot logged in as ${client.user.tag}`);

  // Initial check
  await checkForNewChangelogs(client);

  // Poll every 5 minutes
  setInterval(() => checkForNewChangelogs(client), CHECK_INTERVAL);
});
```

---

## Python Example with discord.py

```python
import discord
from discord.ext import tasks
import aiohttp
from datetime import datetime

CHANGELOG_API = 'https://nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/get-changelogs'
CHANGELOG_CHANNEL_ID = 1473017918210969803
sent_changelogs = set()

category_colors = {
    'feature': 0x3B82F6,
    'bugfix': 0xEF4444,
    'improvement': 0x10B981,
    'security': 0xF59E0B
}

category_emojis = {
    'feature': '✨',
    'bugfix': '🔧',
    'improvement': '🚀',
    'security': '🔒'
}

async def fetch_changelogs(limit=10):
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f'{CHANGELOG_API}?limit={limit}') as response:
                data = await response.json()
                if data.get('success'):
                    return data.get('changelogs', [])
                return []
        except Exception as e:
            print(f'Error fetching changelogs: {e}')
            return []

async def send_changelog(channel, changelog):
    emoji = category_emojis.get(changelog['category'], '📢')
    color = category_colors.get(changelog['category'], 0x5865F2)

    embed = discord.Embed(
        title=f"{emoji} {changelog['version']} - {changelog['title']}",
        description=changelog['description'],
        color=color,
        timestamp=datetime.fromisoformat(changelog['published_at'].replace('Z', '+00:00'))
    )

    embed.add_field(name='Category', value=changelog['category'], inline=True)
    embed.add_field(
        name='Type',
        value='🌟 Major Update' if changelog['is_major'] else 'Minor Update',
        inline=True
    )

    embed.set_footer(text='UserVault Changelog System')

    await channel.send(embed=embed)
    print(f"✅ Sent changelog: {changelog['version']} - {changelog['title']}")

@tasks.loop(minutes=5)
async def check_changelogs():
    print('🔄 Checking for new changelogs...')

    channel = client.get_channel(CHANGELOG_CHANNEL_ID)
    if not channel:
        print('❌ Changelog channel not found')
        return

    changelogs = await fetch_changelogs(20)

    new_count = 0
    for changelog in changelogs:
        if changelog['id'] in sent_changelogs:
            continue

        await send_changelog(channel, changelog)
        sent_changelogs.add(changelog['id'])
        new_count += 1

        await asyncio.sleep(1)  # Rate limit protection

    if new_count > 0:
        print(f'✨ Sent {new_count} new changelog(s)')
    else:
        print('✅ No new changelogs')

@client.event
async def on_ready():
    print(f'🤖 Bot logged in as {client.user}')
    check_changelogs.start()
```

---

## Duplicate Prevention

### In-Memory (Current Implementation)
```javascript
const sentChangelogs = new Set();
sentChangelogs.add(changelog.id);
```

**Problem**: Resets on bot restart → all changelogs resent

### Better: Persistent Storage

#### Option 1: File-Based
```javascript
const fs = require('fs');
const SENT_FILE = './sent_changelogs.json';

function loadSentChangelogs() {
  try {
    return new Set(JSON.parse(fs.readFileSync(SENT_FILE, 'utf8')));
  } catch {
    return new Set();
  }
}

function saveSentChangelogs(set) {
  fs.writeFileSync(SENT_FILE, JSON.stringify([...set]));
}
```

#### Option 2: Time-Based Filter
```javascript
// Only fetch changelogs from last 24 hours
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const changelogs = await fetchChangelogs(50);
const recentChangelogs = changelogs.filter(c => c.published_at > oneDayAgo);
```

---

## Security Guidelines

### ❌ NEVER Include in Changelogs:
- Server IP addresses
- API keys, tokens, secrets
- Database credentials
- Internal file paths
- Port numbers of internal services
- Discord bot tokens
- Webhook URLs
- Private error stack traces
- Admin user IDs (unless public)

### ✅ Safe to Include:
- Feature descriptions
- Bug fixes (without sensitive error details)
- Performance metrics (e.g., "40% faster")
- UI/UX changes
- Dependency updates (e.g., "discord.js v14.16.3 → v14.17.0")
- Public API changes
- Configuration changes (without values)
- Removed features/deprecated APIs

---

## Example Changelog Creation (Admin Panel)

Admins can create changelogs via Dashboard → Owner Panel → Content Management:

**Good Example:**
```
Version: v2.5.0
Title: New Badge System
Description:
Added a new badge system that allows users to:
- Upload custom badge icons (PNG, 512x512px)
- Set custom badge colors
- Reorder badges via drag & drop
- Share badges with friends

Performance improvements:
- Dashboard load time reduced by 40%
- Badge rendering optimized with React.memo
Category: feature
Major Update: ✓
```

**Bad Example (Contains Sensitive Info):**
```
Version: v2.5.0
Title: Fixed Database Connection
Description:
Fixed connection issues by updating:
- Database host: db.internal.example.com:5432
- Updated connection string with new password
- Added retry logic with exponential backoff
Category: bugfix
```

---

## Testing

### 1. Create Test Changelog
1. Login as Admin
2. Go to Dashboard → Owner Panel
3. Scroll to "Content Management"
4. Click "New Changelog"
5. Fill in test data
6. Click "Create"

### 2. Test Bot Integration
```javascript
// Manual test function
async function testChangelogFetch() {
  const response = await fetch('https://nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/get-changelogs?limit=1');
  const data = await response.json();
  console.log(data);
}

testChangelogFetch();
```

### 3. Verify Discord Channel
- Check channel `1473017918210969803`
- Within 5 minutes, new changelog should appear

---

## Troubleshooting

### No Changelogs Appearing?
1. Check API response: `curl https://nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/get-changelogs`
2. Verify bot has access to channel `1473017918210969803`
3. Check bot console for error messages
4. Ensure bot has "Send Messages" and "Embed Links" permissions

### Duplicate Changelogs?
1. Implement persistent storage (see "Duplicate Prevention")
2. Or use time-based filter (last 24h only)

### Rate Limiting?
1. Add delay between messages: `await sleep(1000)`
2. Reduce check interval from 5min to 10min

---

## Public Changelog Page

Users can view changelogs at:
```
https://uservault.net/changelog
```

Features:
- Tab filters (All, Features, Fixes, Improvements, Security)
- Color-coded categories
- Major update badges
- Responsive design

---

## Admin Management

Admins can manage changelogs via:
- **Create**: Add new changelogs
- **Edit**: Update existing entries
- **Delete**: Remove changelogs
- **Preview**: See how it appears to users

All changes are immediately reflected in the API and Discord bot picks them up within 5 minutes.
