import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    console.log('[Discord Sender] Auth header present:', !!authHeader)

    if (!authHeader) {
      console.error('[Discord Sender] No auth header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No auth header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

    console.log('[Discord Sender] Supabase URL:', supabaseUrl)
    console.log('[Discord Sender] Supabase Key present:', !!supabaseKey)

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Discord Sender] Missing Supabase credentials')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })

    console.log('[Discord Sender] Getting user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('[Discord Sender] User error:', userError)
      return new Response(
        JSON.stringify({ error: 'Auth failed: ' + userError.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user) {
      console.error('[Discord Sender] No user found')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[Discord Sender] User ID:', user.id)
    console.log('[Discord Sender] Checking admin role...')

    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    })

    if (roleError) {
      console.error('[Discord Sender] Role check error:', roleError)
      return new Response(
        JSON.stringify({ error: 'Role check failed: ' + roleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[Discord Sender] Is admin:', isAdmin)

    if (!isAdmin) {
      console.error('[Discord Sender] User is not admin')
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN')
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: 'Bot token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { channelId, message, embed } = await req.json()

    if (!channelId) {
      return new Response(
        JSON.stringify({ error: 'Channel ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload: Record<string, unknown> = {
      allowed_mentions: {
        parse: ['everyone', 'roles', 'users']
      }
    }
    
    if (message) {
      payload.content = message
    }
    
    if (embed) {
      payload.embeds = [embed]
    }

    const discordResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text()
      console.error('Discord API error:', discordResponse.status, errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to send message', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await discordResponse.json()
    console.log('Message sent successfully to channel:', channelId)

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
