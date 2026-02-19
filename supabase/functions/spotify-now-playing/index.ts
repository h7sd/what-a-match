import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SPOTIFY_CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID");
const SPOTIFY_CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET");

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error("[spotify-now-playing] Missing secrets: CLIENT_ID=", !!SPOTIFY_CLIENT_ID, "CLIENT_SECRET=", !!SPOTIFY_CLIENT_SECRET);
    return null;
  }
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[spotify-now-playing] Refresh failed:", res.status, body);
    return null;
  }
  const json = await res.json();
  console.log("[spotify-now-playing] Refreshed token, new expiry in", json.expires_in, "s");
  return json;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
      return new Response(JSON.stringify({ playing: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve the auth user_id from the profile id
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", userId)
      .maybeSingle();

    const authUserId = profileRow?.user_id ?? userId;

    // Fetch integration row using service role (tokens are safe here)
    const { data: integration, error } = await supabase
      .from("spotify_integrations")
      .select("access_token, refresh_token, expires_at, show_on_profile")
      .eq("user_id", authUserId)
      .maybeSingle();

    if (error || !integration || !integration.show_on_profile) {
      return new Response(JSON.stringify({ playing: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = integration.access_token;
    const expiresAt = new Date(integration.expires_at).getTime();

    // Refresh token if expired (with 60s buffer)
    if (Date.now() > expiresAt - 60_000) {
      const refreshed = await refreshAccessToken(integration.refresh_token);
      if (refreshed) {
        accessToken = refreshed.access_token;
        const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
        await supabase
          .from("spotify_integrations")
          .update({ access_token: accessToken, expires_at: newExpiry, updated_at: new Date().toISOString() })
          .eq("user_id", userId);
      }
      // If refresh failed but we still have a token, try it anyway
    }

    // Fetch currently playing from Spotify API
    let spotifyRes = await fetch("https://api.spotify.com/v1/me/player/currently-playing?market=from_token", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // If 401, try refreshing once more regardless of expiry time
    if (spotifyRes.status === 401 && integration.refresh_token) {
      const refreshed = await refreshAccessToken(integration.refresh_token);
      if (refreshed) {
        accessToken = refreshed.access_token;
        const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
        await supabase
          .from("spotify_integrations")
          .update({ access_token: accessToken, expires_at: newExpiry, updated_at: new Date().toISOString() })
          .eq("user_id", userId);
        spotifyRes = await fetch("https://api.spotify.com/v1/me/player/currently-playing?market=from_token", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    }

    if (spotifyRes.status === 204 || spotifyRes.status === 404) {
      return new Response(JSON.stringify({ playing: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!spotifyRes.ok) {
      return new Response(JSON.stringify({ playing: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await spotifyRes.json();

    if (!data || !data.is_playing || !data.item) {
      return new Response(JSON.stringify({ playing: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const track = data.item;
    const albumArt = track.album?.images?.[0]?.url ?? null;

    // ONLY return safe, non-sensitive track metadata — NO tokens ever leave this function
    return new Response(
      JSON.stringify({
        playing: true,
        song: track.name,
        artist: track.artists?.map((a: { name: string }) => a.name).join(", ") ?? "",
        album: track.album?.name ?? "",
        albumArt,
        durationMs: track.duration_ms,
        progressMs: data.progress_ms ?? 0,
        trackId: track.id,
        trackUrl: track.external_urls?.spotify ?? null,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    console.error("spotify-now-playing error:", err);
    return new Response(JSON.stringify({ playing: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
