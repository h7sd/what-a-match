# UserVault Discord Bot

Tracks Discord presence and handles badge request approvals/denials.

## Features

✅ Real-time Discord presence tracking
✅ Badge request management with buttons
✅ Approve/Deny/Edit badges via Discord
✅ Automatic changelog announcements
✅ HMAC signature verification
✅ Automatic email notifications  

## Setup

### 1. Create Discord Bot

1. Go to https://discord.com/developers/applications → "New Application"
2. Bot → Add Bot
3. **IMPORTANT**: Enable these intents:
   - ✅ PRESENCE INTENT
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT (optional, for slash commands)
4. Copy the bot token

### 2. Invite Bot

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=2147485696&scope=bot%20applications.commands
```

Permissions needed:
- Send Messages
- Use Slash Commands
- Embed Links

### 3. Create .env

```bash
cp .env.example .env
nano .env
```

Fill in:
```
DISCORD_BOT_TOKEN=your_bot_token
EDGE_FUNCTION_URL=https://nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/discord-presence
BADGE_REQUEST_EDGE_URL=https://nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/badge-request
GUILD_ID=your_server_id
DISCORD_WEBHOOK_SECRET=your_webhook_secret
ADMIN_USER_IDS=your_discord_user_id,other_admin_id
```

### 4. Start

```bash
npm install
npm start
```

### 5. Run 24/7 with PM2

```bash
npm install -g pm2
pm2 start index.js --name uservault-bot
pm2 save
pm2 startup
```

## Badge Request Flow

1. User submits badge request on website
2. Request is sent to Discord webhook channel as an embed
3. **Admin clicks Approve/Deny/Edit button** in Discord
4. Bot sends signed request to edge function
5. Edge function processes and sends email to user
6. User sees status update in dashboard

## Changelog Announcements

The bot automatically polls for new changelogs every 60 seconds and posts them to a designated Discord channel.

1. Admin creates/updates changelog on website
2. Bot fetches latest changelogs from API every 60s
3. New changelogs are posted as rich embeds in Discord
4. Includes version, title, description, category, and type (major/minor)

To enable: Set `CHANGELOG_CHANNEL_ID` in your .env file

## Admin Commands

Badge requests appear with three buttons:
- **Approve** - Instantly approves the badge
- **Deny** - Opens modal for denial reason
- **Edit & Approve** - Opens modal to edit name/color/description before approving

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DISCORD_BOT_TOKEN` | Your bot token from Discord Developer Portal |
| `EDGE_FUNCTION_URL` | Presence edge function URL |
| `BADGE_REQUEST_EDGE_URL` | Badge request edge function URL |
| `GUILD_ID` | Your Discord server ID |
| `DISCORD_WEBHOOK_SECRET` | Secret for HMAC signatures |
| `ADMIN_USER_IDS` | Comma-separated Discord user IDs for admins |
| `CHANGELOG_CHANNEL_ID` | Channel ID for changelog announcements (optional) |
| `CHANGELOGS_API_URL` | API endpoint for fetching changelogs |

## Logs

```
✅ username: online - Spotify
✅ username: dnd - Grand Theft Auto V
📋 Badge Request Management: ENABLED
👮 Admin Users: 123456789
```
