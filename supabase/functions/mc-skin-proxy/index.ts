import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function fetchWithFallback(username: string): Promise<Response | null> {
  const sources = [
    `https://mc-heads.net/skin/${encodeURIComponent(username)}`,
    `https://crafatar.com/skins/${encodeURIComponent(username)}`,
    `https://minotar.net/skin/${encodeURIComponent(username)}`,
  ];

  for (const url of sources) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; UserVault/1.0)" },
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) return response;
    } catch {
      continue;
    }
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");

    if (!username || username.length > 50 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return new Response(JSON.stringify({ error: "Invalid username" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetchWithFallback(username);

    if (!response) {
      return new Response(JSON.stringify({ error: "Skin not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";

    return new Response(imageData, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch skin" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
