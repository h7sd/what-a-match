import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const SPOTIFY_CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID");
    const SPOTIFY_CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: "Spotify not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/spotify-auth?action=callback`;

    // --- Action: get OAuth URL ---
    if (action === "authorize") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );

      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Invalid session" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Store user_id in state param (base64 encoded)
      const state = btoa(JSON.stringify({ userId: user.id, ts: Date.now() }));

      const params = new URLSearchParams({
        response_type: "code",
        client_id: SPOTIFY_CLIENT_ID,
        scope: "user-read-currently-playing user-read-playback-state",
        redirect_uri: REDIRECT_URI,
        state,
        show_dialog: "false",
      });

      return new Response(
        JSON.stringify({ url: `https://accounts.spotify.com/authorize?${params}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Action: OAuth callback from Spotify ---
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      const appUrl = Deno.env.get("APP_URL") || "https://uservault.net";

      if (error || !code || !state) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${appUrl}/dashboard?spotify=error` },
        });
      }

      let userId: string;
      try {
        const parsed = JSON.parse(atob(state));
        userId = parsed.userId;
        const age = Date.now() - parsed.ts;
        if (!userId || age > 10 * 60 * 1000) throw new Error("State expired");
      } catch {
        return new Response(null, {
          status: 302,
          headers: { Location: `${appUrl}/dashboard?spotify=error` },
        });
      }

      // Exchange code for tokens
      const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!tokenRes.ok) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${appUrl}/dashboard?spotify=error` },
        });
      }

      const tokens = await tokenRes.json();

      // Fetch Spotify profile
      const profileRes = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const spotifyProfile = profileRes.ok ? await profileRes.json() : null;

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Upsert into spotify_integrations using service role (tokens never touch the client)
      const { error: upsertError } = await supabase
        .from("spotify_integrations")
        .upsert({
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          scope: tokens.scope,
          spotify_user_id: spotifyProfile?.id ?? null,
          display_name: spotifyProfile?.display_name ?? null,
          show_on_profile: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (upsertError) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${appUrl}/dashboard?spotify=error` },
        });
      }

      return new Response(null, {
        status: 302,
        headers: { Location: `${appUrl}/dashboard?spotify=connected` },
      });
    }

    // --- Action: check connection status (authenticated) ---
    if (action === "status" && req.method === "GET") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ connected: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );

      if (!user) {
        return new Response(JSON.stringify({ connected: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data } = await supabase
        .from("spotify_integrations")
        .select("user_id, display_name, spotify_user_id, show_on_profile, created_at")
        .eq("user_id", user.id)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          connected: !!data,
          displayName: data?.display_name ?? null,
          showOnProfile: data?.show_on_profile ?? false,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("spotify-auth error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
