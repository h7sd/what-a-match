import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Server-side secret for key derivation (unique per installation)
const ENCRYPTION_SECRET = Deno.env.get("ENCRYPTION_SECRET") || "uservault-default-secret-change-in-prod";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;
    
    // Derive user-specific key material
    // This combines the server secret with user ID for unique per-user encryption
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(`${ENCRYPTION_SECRET}:${userId}:file-encryption`);
    
    // Create HMAC-based key derivation
    const key = await crypto.subtle.importKey(
      "raw",
      keyMaterial,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    // Sign to create deterministic key material
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode("derive-file-key"));
    const derivedKeyHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    
    // Add random delay to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    return new Response(
      JSON.stringify({ 
        keyMaterial: derivedKeyHex,
        // Key is valid for 1 hour, client should cache
        expiresAt: Date.now() + 3600000,
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=3600",
        } 
      }
    );
  } catch (error) {
    console.error("Encryption key error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
