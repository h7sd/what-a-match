import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_IP = 60;

const ipRequests = new Map<string, { count: number; resetTime: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of ipRequests.entries()) {
    if (value.resetTime <= now) ipRequests.delete(key);
  }
}, 60 * 1000);

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = ipRequests.get(ip);
  if (!record || record.resetTime <= now) {
    ipRequests.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_IP - 1 };
  }
  if (record.count >= MAX_REQUESTS_PER_IP) {
    return { allowed: false, remaining: 0 };
  }
  record.count++;
  ipRequests.set(ip, record);
  return { allowed: true, remaining: MAX_REQUESTS_PER_IP - record.count };
}

async function hashIP(ip: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  const rateCheck = checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": "60",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { profile_id, username } = body;

    let resolvedProfileId = profile_id;

    if (!resolvedProfileId && username) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", (username as string).toLowerCase())
        .maybeSingle();

      if (profile) {
        resolvedProfileId = profile.id;
      }
    }

    if (!resolvedProfileId) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": String(rateCheck.remaining),
          },
        }
      );
    }

    const ipHash = await hashIP(clientIp, supabaseServiceKey.slice(0, 16));

    // 24-hour dedup window per IP per profile
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: existingView } = await supabase
      .from("profile_views")
      .select("id")
      .eq("profile_id", resolvedProfileId)
      .eq("viewer_ip_hash", ipHash)
      .gte("viewed_at", twentyFourHoursAgo)
      .limit(1);

    if (existingView && existingView.length > 0) {
      return new Response(
        JSON.stringify({ success: true, recorded: false }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": String(rateCheck.remaining),
          },
        }
      );
    }

    const { error: insertError } = await supabase.from("profile_views").insert({
      profile_id: resolvedProfileId,
      viewer_ip_hash: ipHash,
    });

    if (insertError) {
      console.error("Error recording view:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to record view" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": String(rateCheck.remaining),
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, recorded: true }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": String(rateCheck.remaining),
        },
      }
    );
  } catch (error) {
    console.error("Error in record-view function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
