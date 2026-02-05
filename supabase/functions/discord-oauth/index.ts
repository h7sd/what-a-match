import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, redirect_uri, frontend_origin } = await req.json();
    
    const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID');
    
    if (!DISCORD_CLIENT_ID) {
      throw new Error('Discord Client ID not configured');
    }

    if (action === 'get_auth_url') {
      // Encode frontend_origin in state for callback to use
      const stateData = {
        nonce: crypto.randomUUID(),
        origin: frontend_origin || 'https://uservault.cc'
      };
      const state = btoa(JSON.stringify(stateData));
      const scope = 'identify email guilds';
      
      const authUrl = new URL('https://discord.com/api/oauth2/authorize');
      authUrl.searchParams.set('client_id', DISCORD_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirect_uri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('prompt', 'consent');

      console.log('Generated Discord OAuth URL for origin:', stateData.origin);

      return new Response(JSON.stringify({ 
        url: authUrl.toString(),
        state 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Discord OAuth error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
