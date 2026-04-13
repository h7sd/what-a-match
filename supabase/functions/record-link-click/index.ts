import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_IP = 30;

const ipRequests = new Map<string, { count: number; resetTime: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of ipRequests.entries()) {
    if (value.resetTime <= now) ipRequests.delete(key);
  }
}, 60 * 1000);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequests.get(ip);
  if (!record || record.resetTime <= now) {
    ipRequests.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_IP) return false;
  record.count++;
  ipRequests.set(ip, record);
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { linkId } = await req.json();

    if (!linkId || typeof linkId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid linkId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash IP + linkId + secret salt for privacy
    const encoder = new TextEncoder();
    const data = encoder.encode(clientIp + linkId + (supabaseServiceKey.slice(0, 16)));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const ipHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Dedup: 1 hour window per IP per link to prevent botting
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentClick } = await supabase
      .from("link_clicks")
      .select("id")
      .eq("link_id", linkId)
      .eq("viewer_ip_hash", ipHash)
      .gte("clicked_at", oneHourAgo)
      .maybeSingle();

    if (recentClick) {
      return new Response(
        JSON.stringify({ success: true, recorded: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const country = req.headers.get("cf-ipcountry") || null;

    const { error: clickError } = await supabase
      .from("link_clicks")
      .insert({
        link_id: linkId,
        viewer_ip_hash: ipHash,
        viewer_country: country,
      });

    if (clickError) {
      console.error("Error recording click:", clickError);
      return new Response(
        JSON.stringify({ error: "Failed to record click" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: rpcError } = await supabase.rpc("increment_link_click_count", {
      p_link_id: linkId,
    });

    if (rpcError) {
      console.error("Error incrementing click count:", rpcError);
    }

    return new Response(
      JSON.stringify({ success: true, recorded: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in record-link-click function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
