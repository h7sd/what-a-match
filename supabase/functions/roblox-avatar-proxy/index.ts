import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getRobloxUserId(username: string): Promise<number | null> {
  try {
    const res = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error("User lookup failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await res.json();
    return data?.data?.[0]?.id ?? null;
  } catch (e) {
    console.error("User lookup error:", e);
    return null;
  }
}

async function getAvatarImageUrl(userId: number): Promise<string | null> {
  const endpoints = [
    `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`,
    `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`,
    `https://thumbnails.roblox.com/v1/users/avatar-full?userIds=${userId}&size=720x720&format=Png&isCircular=false`,
    `https://thumbnails.roblox.com/v1/users/avatar-full?userIds=${userId}&size=420x420&format=Png&isCircular=false`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        console.log(`Endpoint ${url} returned ${res.status}`);
        continue;
      }
      const data = await res.json();
      const item = data?.data?.[0];
      console.log(`Endpoint result for ${url}:`, JSON.stringify(item));
      if (item?.imageUrl) {
        return item.imageUrl;
      }
    } catch (e) {
      console.log(`Endpoint ${url} error:`, e);
      continue;
    }
  }

  // Fallback: try the legacy render URL directly (no auth needed)
  try {
    const renderUrl = `https://www.roblox.com/Thumbs/Avatar.ashx?x=420&y=420&userId=${userId}`;
    const res = await fetch(renderUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (res.ok && res.headers.get("content-type")?.startsWith("image/")) {
      return renderUrl;
    }
  } catch (e) {
    console.log("Legacy render fallback error:", e);
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

    const userId = await getRobloxUserId(username);
    if (!userId) {
      return new Response(JSON.stringify({ error: "User not found", username }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageUrl = await getAvatarImageUrl(userId);
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Thumbnail unavailable", userId }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the actual image and proxy it
    const imgRes = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });

    if (!imgRes.ok) {
      return new Response(JSON.stringify({ error: "Image fetch failed", status: imgRes.status }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = imgRes.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) {
      const body = await imgRes.text();
      return new Response(JSON.stringify({ error: "Not an image", contentType, body: body.slice(0, 200) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageData = await imgRes.arrayBuffer();

    return new Response(imageData, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({ error: "Internal error", detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
