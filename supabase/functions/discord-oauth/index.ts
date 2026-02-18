const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ message, error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, redirect_uri, frontend_origin, mode, user_id } = body;

    const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID');

    if (!DISCORD_CLIENT_ID) {
      return errorResponse('Discord Client ID not configured (set DISCORD_CLIENT_ID secret)');
    }

    if (action !== 'get_auth_url') {
      return errorResponse('Invalid action: expected get_auth_url', 400);
    }

    if (!redirect_uri) {
      return errorResponse('redirect_uri is required', 400);
    }

    const stateData: Record<string, string> = {
      nonce: crypto.randomUUID(),
      origin: frontend_origin || 'https://uservault.cc',
      mode: mode || 'login',
    };
    if (user_id) stateData.user_id = String(user_id);

    const state = btoa(JSON.stringify(stateData));
    const scope = 'identify email guilds';

    const authUrl = new URL('https://discord.com/api/oauth2/authorize');
    authUrl.searchParams.set('client_id', DISCORD_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirect_uri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'consent');

    console.log('Discord OAuth URL generated, mode:', mode || 'login', 'origin:', stateData.origin);

    return new Response(JSON.stringify({ url: authUrl.toString(), state }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Discord OAuth error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message);
  }
});
