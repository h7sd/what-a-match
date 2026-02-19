import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FETCH_HEADERS = {
  "Accept": "*/*",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

async function getRobloxUserId(username: string): Promise<number | null> {
  try {
    const res = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { ...FETCH_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function get2dThumbnailUrl(userId: number): Promise<string | null> {
  const sizes = ["720x720", "420x420", "352x352"];
  for (const size of sizes) {
    try {
      const res = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=${size}&format=Png&isCircular=false`,
        { headers: FETCH_HEADERS, signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const item = data?.data?.[0];
      if (item?.imageUrl) return item.imageUrl;
    } catch {
      continue;
    }
  }
  return null;
}

const CDN_BASE = "https://t3.rbxcdn.com";

async function get3dManifest(userId: number): Promise<any | null> {
  try {
    // Get the manifest URL from Roblox API
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-3d?userId=${userId}`,
      { headers: FETCH_HEADERS, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.state !== "Completed" || !data?.imageUrl) return null;

    // Fetch the manifest JSON (the -Obj url returns JSON, not an actual OBJ file)
    const manifestRes = await fetch(data.imageUrl, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if (!manifestRes.ok) return null;
    const manifest = await manifestRes.json();
    return manifest;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
    const mode = url.searchParams.get("mode") || "2d";

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

    // 3D manifest mode: fetch manifest server-side and return full CDN URLs to browser
    if (mode === "3d") {
      const manifest = await get3dManifest(userId);
      if (!manifest) {
        return new Response(JSON.stringify({ error: "3D model unavailable", userId }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Return full CDN URLs so the browser can load them directly
      const result = {
        objUrl: `${CDN_BASE}/${manifest.obj}`,
        mtlUrl: `${CDN_BASE}/${manifest.mtl}`,
        textureUrls: (manifest.textures || []).map((t: string) => `${CDN_BASE}/${t}`),
        textureIds: manifest.textures || [],
        camera: manifest.camera,
        aabb: manifest.aabb,
        userId,
      };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
      });
    }

    // Default 2D mode: proxy the avatar image through our server
    const thumbnailUrl = await get2dThumbnailUrl(userId);
    if (!thumbnailUrl) {
      return new Response(JSON.stringify({ error: "Thumbnail unavailable", userId }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imgRes = await fetch(thumbnailUrl, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(12000) });
    if (!imgRes.ok) {
      return new Response(JSON.stringify({ error: "Image fetch failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = imgRes.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) {
      return new Response(JSON.stringify({ error: "Not an image" }), {
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
    return new Response(JSON.stringify({ error: "Internal error", detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
