import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ServiceCheck {
  serviceSlug: string;
  status: "operational" | "degraded" | "outage";
  responseTimeMs?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

async function checkWebsite(): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    const response = await fetch("https://uservault.cc", {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    const elapsed = Math.round(performance.now() - start);

    return {
      serviceSlug: "website",
      status: response.ok ? "operational" : "degraded",
      responseTimeMs: elapsed,
    };
  } catch (error) {
    return {
      serviceSlug: "website",
      status: "outage",
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkCloudflare(): Promise<ServiceCheck> {
  try {
    const response = await fetch("https://uservault.cc", {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    const cfRay = response.headers.get("cf-ray");

    return {
      serviceSlug: "cloudflare",
      status: cfRay ? "operational" : "degraded",
      metadata: { cfRay: cfRay || null },
    };
  } catch (error) {
    return {
      serviceSlug: "cloudflare",
      status: "outage",
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkDatabase(supabase: ReturnType<typeof createClient>): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    const { error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .maybeSingle();

    const elapsed = Math.round(performance.now() - start);

    return {
      serviceSlug: "database",
      status: error ? "degraded" : "operational",
      responseTimeMs: elapsed,
      errorMessage: error?.message,
    };
  } catch (error) {
    return {
      serviceSlug: "database",
      status: "outage",
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkAuth(supabase: ReturnType<typeof createClient>): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    const { error } = await supabase.auth.getSession();
    const elapsed = Math.round(performance.now() - start);

    return {
      serviceSlug: "auth",
      status: error ? "degraded" : "operational",
      responseTimeMs: elapsed,
      errorMessage: error?.message,
    };
  } catch (error) {
    return {
      serviceSlug: "auth",
      status: "outage",
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkHealthEndpoint(supabaseUrl: string, anonKey: string): Promise<{
  loginRegister: ServiceCheck;
  discordBot: ServiceCheck;
  edgeFunctions: ServiceCheck;
}> {
  const start = performance.now();
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/health`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ source: "status-check" }),
      signal: AbortSignal.timeout(10000),
    });

    const elapsed = Math.round(performance.now() - start);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data = await response.json();

    const loginOk = data?.checks?.login_endpoint?.status === "ok";
    const registerOk = data?.checks?.register_endpoint?.status === "ok";
    const loginStatus = (loginOk && registerOk) ? "operational" : (loginOk || registerOk) ? "degraded" : "outage";
    const loginTime = Math.max(
      data?.checks?.login_endpoint?.latency_ms || 0,
      data?.checks?.register_endpoint?.latency_ms || 0
    ) || undefined;

    const bot = data?.checks?.discord_bot;
    const botStatus = bot?.status === "ok" ? (bot?.error ? "degraded" : "operational") : "outage";

    const edgeStatus = data.status === "healthy" ? "operational" : data.status === "degraded" ? "degraded" : "outage";

    return {
      loginRegister: {
        serviceSlug: "login-register",
        status: loginStatus,
        responseTimeMs: loginTime,
        metadata: { checks: data?.checks },
      },
      discordBot: {
        serviceSlug: "discord-bot",
        status: botStatus,
        responseTimeMs: bot?.latency_ms,
        errorMessage: bot?.error || undefined,
      },
      edgeFunctions: {
        serviceSlug: "edge-functions",
        status: edgeStatus,
        responseTimeMs: elapsed,
        metadata: { overall: data },
      },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      loginRegister: {
        serviceSlug: "login-register",
        status: "outage",
        errorMessage: errorMsg,
      },
      discordBot: {
        serviceSlug: "discord-bot",
        status: "outage",
        errorMessage: errorMsg,
      },
      edgeFunctions: {
        serviceSlug: "edge-functions",
        status: "outage",
        errorMessage: errorMsg,
      },
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[STATUS-CHECK] Starting service checks...");

    const checks = await Promise.all([
      checkWebsite(),
      checkCloudflare(),
      checkDatabase(supabase),
      checkAuth(supabase),
      checkHealthEndpoint(supabaseUrl, anonKey),
    ]);

    const [website, cloudflare, database, auth, healthChecks] = checks;
    const allChecks = [
      website,
      cloudflare,
      database,
      auth,
      healthChecks.loginRegister,
      healthChecks.discordBot,
      healthChecks.edgeFunctions,
    ];

    console.log("[STATUS-CHECK] Checks completed:", allChecks.map(c => `${c.serviceSlug}: ${c.status}`).join(", "));

    const { data: services } = await supabase
      .from("services")
      .select("id, slug");

    if (!services) {
      throw new Error("Failed to fetch services");
    }

    const serviceMap = new Map(services.map(s => [s.slug, s.id]));

    const statusInserts = allChecks.map(check => ({
      service_id: serviceMap.get(check.serviceSlug),
      status: check.status,
      response_time_ms: check.responseTimeMs,
      error_message: check.errorMessage,
      metadata: check.metadata,
      checked_at: new Date().toISOString(),
    })).filter(insert => insert.service_id);

    const { error: insertError } = await supabase
      .from("service_status_checks")
      .insert(statusInserts);

    if (insertError) {
      console.error("[STATUS-CHECK] Failed to insert status checks:", insertError);
      throw insertError;
    }

    console.log("[STATUS-CHECK] Successfully saved status checks to database");

    return new Response(
      JSON.stringify({
        success: true,
        checks: allChecks,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[STATUS-CHECK] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
