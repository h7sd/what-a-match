/**
 * Cloudflare Pages Function für UserVault Open Graph Embeds
 * Wird automatisch deployed wenn die Seite auf Cloudflare Pages gehostet ist
 */

// Bot User-Agent patterns
const BOT_PATTERNS = [
  /discordbot/i,
  /twitterbot/i,
  /telegrambot/i,
  /whatsapp/i,
  /slackbot/i,
  /linkedinbot/i,
  /facebookexternalhit/i,
  /facebot/i,
  /applebot/i,
  /googlebot/i,
  /bingbot/i,
  /embedly/i,
  /pinterest/i,
  /redditbot/i,
];

const OG_FUNCTION_URL = "https://nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/share";

function isBot(request) {
  const ua = request.headers.get("User-Agent") || "";
  const url = new URL(request.url);

  if (url.searchParams.has("__bot")) return true;

  for (const pattern of BOT_PATTERNS) {
    if (pattern.test(ua)) return true;
  }
  return false;
}

function extractUsername(url) {
  const path = url.pathname;

  const ignorePaths = [
    "/", "/auth", "/dashboard", "/privacy", "/terms", "/imprint",
    "/assets", "/favicon.ico", "/robots.txt", "/premium", "/marketplace",
    "/changelog", "/status", "/cases", "/og-image.png", "/placeholder.svg",
    "/_worker.js"
  ];

  for (const ignore of ignorePaths) {
    if (path === ignore || path.startsWith(ignore + "/")) {
      return null;
    }
  }

  if (path.startsWith("/assets/") || path.includes(".")) {
    return null;
  }

  let username = path.replace(/^\/+/, "").replace(/^@/, "").replace(/\/+$/, "");

  if (!username || !/^[a-zA-Z0-9_.]+$/.test(username)) {
    return null;
  }

  return username;
}

async function fetchOGHtml(username, originalUrl) {
  try {
    const encodedUsername = encodeURIComponent(username);
    const encodedSrc = encodeURIComponent(originalUrl);
    const ogUrl = `${OG_FUNCTION_URL}?u=${encodedUsername}&src=${encodedSrc}`;

    const res = await fetch(ogUrl, {
      method: "GET",
      headers: {
        "User-Agent": "UserVault-OG-Worker/1.0",
      },
    });

    if (!res.ok) {
      return null;
    }

    return await res.text();
  } catch (error) {
    console.error(`[OG] Fetch error for ${username}:`, error.message);
    return null;
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const username = extractUsername(url);
    const botDetected = isBot(request);

    // Not a profile page or not a bot -> serve static assets
    if (!username || !botDetected) {
      return env.ASSETS.fetch(request);
    }

    // Bot detected for a profile page - generate OG HTML
    try {
      const html = await fetchOGHtml(username, url.toString());

      if (!html) {
        return env.ASSETS.fetch(request);
      }

      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-OG-Worker": "active",
        },
      });
    } catch (error) {
      return env.ASSETS.fetch(request);
    }
  },
};
