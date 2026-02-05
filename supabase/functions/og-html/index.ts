import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");

    if (!username) {
      return new Response("Username required", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if username is numeric (uid_number) or string (username/alias)
    let query;
    if (/^\d+$/.test(username)) {
      query = supabase
        .from("profiles")
        .select("username, display_name, bio, avatar_url, og_title, og_description, og_image_url, og_icon_url")
        .eq("uid_number", parseInt(username))
        .maybeSingle();
    } else {
      query = supabase
        .from("profiles")
        .select("username, display_name, bio, avatar_url, og_title, og_description, og_image_url, og_icon_url")
        .or(`username.eq.${username.toLowerCase()},alias_username.eq.${username.toLowerCase()}`)
        .maybeSingle();
    }

    const { data: profile, error } = await query;

    if (error || !profile) {
      console.log(`[OG-HTML] Profile not found: ${username}`);
      return new Response("Profile not found", {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // Build OG data with fallbacks
    const title = profile.og_title || profile.display_name || `@${profile.username}`;
    const description = profile.og_description || profile.bio || `Check out ${profile.display_name || profile.username}'s profile on UserVault`;
    const image = profile.og_image_url || profile.avatar_url || "https://what-a-match.lovable.app/og-image.png";
    const icon = profile.og_icon_url || "https://storage.googleapis.com/gpt-engineer-file-uploads/N7OIoQRjNPSXaLFdJjQDPkdaXHs1/uploads/1769473434323-UserVault%204%20(1).png";
    const profileUrl = `https://uservault.cc/${profile.username}`;

    // Generate full HTML with OG tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | UserVault</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph / Discord -->
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="UserVault">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:url" content="${escapeHtml(profileUrl)}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  
  <!-- Favicon -->
  <link rel="icon" href="${escapeHtml(icon)}">
  
  <!-- Redirect real users to the actual profile -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(profileUrl)}">
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(profileUrl)}">${escapeHtml(title)}</a>...</p>
</body>
</html>`;

    console.log(`[OG-HTML] Generated for: ${username} -> ${profile.username}`);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("[OG-HTML] Error:", error);
    return new Response("Internal server error", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
