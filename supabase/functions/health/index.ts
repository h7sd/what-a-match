import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Health check function to test all API endpoints
async function runHealthCheck(supabase: any): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, { status: 'ok' | 'error'; latency_ms: number; error?: string }>;
  timestamp: string;
  version: string;
}> {
  const checks: Record<string, { status: 'ok' | 'error'; latency_ms: number; error?: string }> = {};
  
  // Test database connectivity
  const dbStart = Date.now();
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    checks.database = { 
      status: error ? 'error' : 'ok', 
      latency_ms: Date.now() - dbStart,
      ...(error && { error: 'Connection failed' })
    };
  } catch (e) {
    checks.database = { status: 'error', latency_ms: Date.now() - dbStart, error: 'Connection failed' };
  }

  // Test auth service
  const authStart = Date.now();
  try {
    const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    checks.auth = { 
      status: error ? 'error' : 'ok', 
      latency_ms: Date.now() - authStart,
      ...(error && { error: 'Auth service unavailable' })
    };
  } catch (e) {
    checks.auth = { status: 'error', latency_ms: Date.now() - authStart, error: 'Auth service unavailable' };
  }

  // Test profiles query
  const statsStart = Date.now();
  try {
    const { error } = await supabase.from('profiles').select('views_count').limit(5);
    checks.profiles = { 
      status: error ? 'error' : 'ok', 
      latency_ms: Date.now() - statsStart,
      ...(error && { error: 'Query failed' })
    };
  } catch (e) {
    checks.profiles = { status: 'error', latency_ms: Date.now() - statsStart, error: 'Query failed' };
  }

  // Test social_links query
  const linksStart = Date.now();
  try {
    const { error } = await supabase.from('social_links').select('id').limit(1);
    checks.social_links = { 
      status: error ? 'error' : 'ok', 
      latency_ms: Date.now() - linksStart,
      ...(error && { error: 'Query failed' })
    };
  } catch (e) {
    checks.social_links = { status: 'error', latency_ms: Date.now() - linksStart, error: 'Query failed' };
  }

  // Test global_badges query
  const badgesStart = Date.now();
  try {
    const { error } = await supabase.from('global_badges').select('id').limit(1);
    checks.badges = { 
      status: error ? 'error' : 'ok', 
      latency_ms: Date.now() - badgesStart,
      ...(error && { error: 'Query failed' })
    };
  } catch (e) {
    checks.badges = { status: 'error', latency_ms: Date.now() - badgesStart, error: 'Query failed' };
  }

  // Test username check (register flow)
  const usernameStart = Date.now();
  try {
    const { error } = await supabase.from('profiles').select('id').eq('username', 'health_check_test').limit(1);
    checks.username_check = { 
      status: error ? 'error' : 'ok', 
      latency_ms: Date.now() - usernameStart,
      ...(error && { error: 'Query failed' })
    };
  } catch (e) {
    checks.username_check = { status: 'error', latency_ms: Date.now() - usernameStart, error: 'Query failed' };
  }

  // Test email lookup (login flow)
  const emailStart = Date.now();
  try {
    const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    checks.email_lookup = { 
      status: error ? 'error' : 'ok', 
      latency_ms: Date.now() - emailStart,
      ...(error && { error: 'Query failed' })
    };
  } catch (e) {
    checks.email_lookup = { status: 'error', latency_ms: Date.now() - emailStart, error: 'Query failed' };
  }

  // Calculate overall status
  const errorCount = Object.values(checks).filter(c => c.status === 'error').length;
  const totalChecks = Object.keys(checks).length;
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (errorCount === 0) {
    status = 'healthy';
  } else if (errorCount < totalChecks / 2) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const result = await runHealthCheck(supabase);

    // Return appropriate HTTP status based on health
    const httpStatus = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;

    return new Response(
      JSON.stringify(result),
      { 
        status: httpStatus,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        } 
      }
    );

  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({ 
        status: 'unhealthy', 
        error: 'Internal error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 503, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
