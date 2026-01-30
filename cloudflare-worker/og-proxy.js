/**
 * Cloudflare Worker für UserVault Open Graph Embeds
 * 
 * Dieser Worker erkennt Bot-Requests (Discord, Twitter, etc.) und leitet sie
 * zur Supabase Edge Function weiter, die dynamische OG-Meta-Tags generiert.
 * 
 * SETUP:
 * 1. Gehe zu cloudflare.com → Workers & Pages → Create Worker
 * 2. Füge diesen Code ein
 * 3. Gehe zu Settings → Triggers → Add Route
 * 4. Route: uservault.cc/* (oder www.uservault.cc/*)
 * 5. Stelle sicher dass DNS-Records auf "Proxied" (orangene Wolke) stehen
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
  /ia_archiver/i,
  /archive\.org_bot/i,
  /embedly/i,
  /quora link preview/i,
  /showyoubot/i,
  /outbrain/i,
  /pinterest/i,
  /redditbot/i,
  /viber/i,
  /tumblr/i,
  /skypeuripreview/i,
  /nuzzel/i,
  /pocket/i,
  /flipboard/i,
  /bitlybot/i,
  /vkshare/i,
  /w3c_validator/i,
  /curl/i,
  /wget/i,
];

// Supabase Edge Function URL
const SUPABASE_PROJECT_REF = "cjulgfbmcnmrkvnzkpym";
const SHARE_FUNCTION_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/share`;

/**
 * Erkennt ob ein Request von einem Bot kommt
 */
function isBot(request) {
  const ua = request.headers.get("User-Agent") || "";
  
  // Debug mode: ?__bot=1 erzwingt Bot-Verhalten
  const url = new URL(request.url);
  if (url.searchParams.has("__bot")) {
    return true;
  }
  
  // Check User-Agent gegen Bot-Patterns
  for (const pattern of BOT_PATTERNS) {
    if (pattern.test(ua)) {
      return true;
    }
  }
  
  // Zusätzlicher Check: Bots senden normalerweise kein sec-ch-ua Header
  // (das ist ein Browser-only Header)
  const secChUa = request.headers.get("sec-ch-ua");
  if (!secChUa && BOT_PATTERNS.some(p => p.test(ua))) {
    return true;
  }
  
  return false;
}

/**
 * Extrahiert den Username aus der URL
 * Unterstützt: /username, /1 (uid), /@username
 */
function extractUsername(url) {
  const path = url.pathname;
  
  // Ignoriere statische Pfade
  const ignorePaths = [
    "/",
    "/auth",
    "/dashboard",
    "/privacy",
    "/terms",
    "/imprint",
    "/assets",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
  ];
  
  // Check ob Pfad mit ignorierten Pfaden beginnt
  for (const ignore of ignorePaths) {
    if (path === ignore || path.startsWith(ignore + "/") || path.startsWith("/assets/")) {
      return null;
    }
  }
  
  // Extrahiere Username (entferne leading slash und optional @)
  let username = path.replace(/^\/+/, "").replace(/^@/, "");
  
  // Entferne trailing slashes
  username = username.replace(/\/+$/, "");
  
  // Nur alphanumerische + underscore + dot erlaubt (oder nur Zahlen für UID)
  if (!username || !/^[a-zA-Z0-9_.]+$/.test(username)) {
    return null;
  }
  
  return username;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Extrahiere Username
    const username = extractUsername(url);
    
    // Wenn kein Username oder kein Bot, weiter zur Origin
    if (!username || !isBot(request)) {
      return fetch(request);
    }
    
    // Bot erkannt! Leite zur Share Edge Function weiter
    console.log(`[OG-PROXY] Bot detected for: ${username}`);
    
    try {
      const shareUrl = new URL(SHARE_FUNCTION_URL);
      shareUrl.searchParams.set("u", username);
      shareUrl.searchParams.set("src", request.url); // Original URL für og:url
      
      const response = await fetch(shareUrl.toString(), {
        method: "GET",
        headers: {
          "User-Agent": request.headers.get("User-Agent") || "Cloudflare-Worker",
        },
      });
      
      // Bei Fehler (404, 500, etc.) zur Origin weiterleiten
      if (!response.ok) {
        console.log(`[OG-PROXY] Share function returned ${response.status}, falling back to origin`);
        return fetch(request);
      }
      
      // HTML-Response mit korrekten Headers zurückgeben
      const html = await response.text();
      
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Robots-Tag": "noindex", // Bots sollen diese Seite nicht indexieren
        },
      });
    } catch (error) {
      console.error(`[OG-PROXY] Error:`, error);
      // Bei Fehler zur Origin weiterleiten
      return fetch(request);
    }
  },
};
