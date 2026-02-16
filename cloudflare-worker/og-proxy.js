/**
 * Cloudflare Worker für UserVault Open Graph Embeds
 * 
 * Ruft die Edge Function auf um OG-HTML für Discord/Twitter zu generieren
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
  /yandex/i,
  /baiduspider/i,
  /embedly/i,
  /pinterest/i,
  /redditbot/i,
  /viber/i,
  /tumblr/i,
  /skypeuripreview/i,
  /vkshare/i,
];

// Edge Function URL for OG HTML generation
const OG_FUNCTION_URL = "https://nuszlhxbyxdjlaubuwzd.supabase.co/functions/v1/share";

function isBot(request) {
  const ua = request.headers.get("User-Agent") || "";
  const url = new URL(request.url);
  
  // Debug: ?__bot=1 forces bot behavior
  if (url.searchParams.has("__bot")) return true;
  
  for (const pattern of BOT_PATTERNS) {
    if (pattern.test(ua)) return true;
  }
  return false;
}

function extractUsername(url) {
  const path = url.pathname;

  // Ignore common app routes and static assets
  const ignorePaths = [
    "/", "/auth", "/dashboard", "/privacy", "/terms", "/imprint",
    "/assets", "/favicon.ico", "/robots.txt", "/premium", "/marketplace",
    "/changelog", "/status", "/cases", "/og-image.png", "/placeholder.svg"
  ];

  for (const ignore of ignorePaths) {
    if (path === ignore || path.startsWith(ignore + "/")) {
      return null;
    }
  }

  // Ignore assets directory completely
  if (path.startsWith("/assets/") || path.includes(".")) {
    return null;
  }

  // Extract username from path (supports @username and plain username)
  let username = path.replace(/^\/+/, "").replace(/^@/, "").replace(/\/+$/, "");

  // Allow alphanumeric usernames, including pure numbers (like "1" for uid_number)
  // This supports both usernames and uid_numbers
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

    console.log(`[OG] Fetching embed for username/uid: ${username}`);
    console.log(`[OG] Request URL: ${ogUrl}`);

    const res = await fetch(ogUrl, {
      method: "GET",
      headers: {
        "User-Agent": "UserVault-OG-Worker/1.0",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.log(`[OG] Edge function returned ${res.status} for: ${username}`);
      console.log(`[OG] Error response: ${errorText.substring(0, 200)}`);
      return null;
    }

    const html = await res.text();
    console.log(`[OG] Successfully generated embed for: ${username}`);
    return html;
  } catch (error) {
    console.error(`[OG] Fetch error for ${username}:`, error.message);
    return null;
  }
}

// Pass request through to origin (change YOUR_ORIGIN to your actual origin URL)
// If using Cloudflare Pages: this should point to your Pages deployment
// If using other hosting: point to your hosting URL (e.g., "https://your-origin.pages.dev")
async function passThrough(request, env) {
  const url = new URL(request.url);

  // If using Cloudflare Pages with _worker.js, use env.ASSETS.fetch(request)
  // For standalone worker, replace with your origin URL
  const originUrl = env.ORIGIN_URL || "https://your-pages-project.pages.dev";
  const targetUrl = new URL(url.pathname + url.search, originUrl);

  return fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const username = extractUsername(url);
    const botDetected = isBot(request);
    const userAgent = request.headers.get("User-Agent") || "unknown";

    // Debug header to confirm Worker is active
    const debugHeaders = {
      "X-OG-Worker": "active",
      "X-OG-Username": username || "null",
      "X-OG-IsBot": String(botDetected),
    };

    console.log(`[OG] Request: ${url.pathname}`);
    console.log(`[OG] Extracted username/uid: ${username || "none"}`);
    console.log(`[OG] Bot detected: ${botDetected}`);
    console.log(`[OG] User-Agent: ${userAgent.substring(0, 100)}`);

    // Not a profile page or not a bot -> pass through to app
    if (!username) {
      console.log(`[OG] No username extracted, passing through`);
      const response = await passThrough(request, env);
      const newResponse = new Response(response.body, response);
      Object.entries(debugHeaders).forEach(([k, v]) => newResponse.headers.set(k, v));
      return newResponse;
    }

    if (!botDetected) {
      console.log(`[OG] Not a bot, passing through for: ${username}`);
      const response = await passThrough(request, env);
      const newResponse = new Response(response.body, response);
      Object.entries(debugHeaders).forEach(([k, v]) => newResponse.headers.set(k, v));
      return newResponse;
    }

    console.log(`[OG] Bot detected for username/uid: ${username}`);

    try {
      const html = await fetchOGHtml(username, url.toString());

      if (!html) {
        console.log(`[OG] No HTML returned, passing through for: ${username}`);
        const response = await passThrough(request, env);
        const newResponse = new Response(response.body, response);
        newResponse.headers.set("X-OG-Worker", "active-no-profile");
        return newResponse;
      }

      console.log(`[OG] Serving generated OG HTML for: ${username}`);

      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "X-Robots-Tag": "noindex",
          "X-OG-Worker": "active-generated",
          "X-OG-Profile": username,
        },
      });
    } catch (error) {
      console.error(`[OG] Error generating embed for ${username}:`, error);
      const response = await passThrough(request, env);
      const newResponse = new Response(response.body, response);
      newResponse.headers.set("X-OG-Worker", "error");
      newResponse.headers.set("X-OG-Error", error.message);
      return newResponse;
    }
  },
};
