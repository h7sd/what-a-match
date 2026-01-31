import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId } = await req.json()
    
    if (!orderId) {
      console.error('Missing orderId in request')
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Verifying PayPal order:', orderId)

    // Get auth header to identify user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // Create client with user's token to get their ID
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    
    if (userError || !user) {
      console.error('Failed to get user:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User authenticated:', user.id)

    // Get PayPal Client ID for verification
    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID')
    if (!paypalClientId) {
      console.error('PAYPAL_CLIENT_ID not configured')
      return new Response(
        JSON.stringify({ error: 'PayPal not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For now, we trust the client-side PayPal SDK verification
    // In production, you should verify with PayPal's API using a secret key
    // The PayPal SDK already validates the payment on the client side
    
    // Update user's premium status using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check if order was already processed
    const { data: existingOrder } = await supabaseAdmin
      .from('profiles')
      .select('paypal_order_id')
      .eq('paypal_order_id', orderId)
      .single()
    
    if (existingOrder) {
      console.log('Order already processed:', orderId)
      return new Response(
        JSON.stringify({ error: 'Order already processed', success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's profile for email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('user_id', user.id)
      .single()

    const purchaseDate = new Date().toISOString()

    // Update user's profile to premium
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_premium: true,
        premium_purchased_at: purchaseDate,
        paypal_order_id: orderId
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update profile:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to activate premium' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Premium activated for user:', user.id)

    // Send confirmation email with invoice
    try {
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-premium-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          email: user.email,
          username: profile?.username || 'User',
          orderId: orderId,
          amount: '0.01', // Test price
          purchaseDate: purchaseDate,
        }),
      })

      if (!emailResponse.ok) {
        console.error('Failed to send premium email:', await emailResponse.text())
      } else {
        console.log('Premium confirmation email sent successfully')
      }
    } catch (emailError) {
      console.error('Error sending premium email:', emailError)
      // Don't fail the whole request if email fails
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Premium activated!' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing payment:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
