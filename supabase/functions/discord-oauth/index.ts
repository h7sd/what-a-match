const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function okResponse(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
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
      console.error('DISCORD_CLIENT_ID secret is not set');
      return okResponse({ error: 'Discord ist nicht konfiguriert. Bitte DISCORD_CLIENT_ID Secret setzen.' });
    }

    if (action !== 'get_auth_url') {
      return okResponse({ error: 'Invalid action: expected get_auth_url' });
    }

    if (!redirect_uri) {
      return okResponse({ error: 'redirect_uri is required' });
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

    return okResponse({ url: authUrl.toString(), state });

  } catch (error: unknown) {
    console.error('Discord OAuth error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return okResponse({ error: message });
  }
});
