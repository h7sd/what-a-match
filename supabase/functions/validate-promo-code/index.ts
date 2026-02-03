import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()
    
    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Promo code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Get user from auth header if present
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null

    if (authHeader) {
      const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      })
      const { data: { user } } = await supabaseUser.auth.getUser()
      userId = user?.id || null
    }

    // Use service role to access promo_codes table
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: promoCode, error } = await supabaseAdmin
      .from('promo_codes')
      .select('id, code, discount_percentage, type, expires_at, max_uses, uses_count, is_active')
      .eq('code', code.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to validate code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!promoCode) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid promo code' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if expired
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: 'This promo code has expired' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if max uses reached
    if (promoCode.max_uses && promoCode.uses_count >= promoCode.max_uses) {
      return new Response(
        JSON.stringify({ valid: false, error: 'This promo code has reached its maximum uses' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already used this code
    if (userId) {
      const { data: existingUse } = await supabaseAdmin
        .from('promo_code_uses')
        .select('id')
        .eq('code_id', promoCode.id)
        .eq('user_id', userId)
        .maybeSingle()

      if (existingUse) {
        return new Response(
          JSON.stringify({ valid: false, error: 'You have already used this promo code' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Code is valid
    return new Response(
      JSON.stringify({
        valid: true,
        code: promoCode.code,
        discount: promoCode.discount_percentage,
        type: promoCode.type,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error validating promo code:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
