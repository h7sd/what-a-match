import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { itemIds, sellAll } = await req.json();

    if (!sellAll && (!itemIds || itemIds.length === 0)) {
      throw new Error('Item IDs required');
    }

    let query = supabase
      .from('user_inventory')
      .select('id, estimated_value')
      .eq('user_id', user.id)
      .eq('sold', false);

    if (!sellAll) {
      query = query.in('id', itemIds);
    }

    const { data: items, error: itemsError } = await query;

    if (itemsError || !items || items.length === 0) {
      throw new Error('No items found to sell');
    }

    const totalValue = items.reduce((sum, item) => sum + BigInt(item.estimated_value), 0n);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('uc_balance')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    const newBalance = BigInt(profile.uc_balance) + totalValue;

    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ uc_balance: newBalance.toString() })
      .eq('id', user.id);

    if (balanceError) {
      throw new Error('Failed to update balance');
    }

    const itemIdsToUpdate = items.map(item => item.id);

    const { error: updateError } = await supabase
      .from('user_inventory')
      .update({ sold: true, sold_at: new Date().toISOString() })
      .in('id', itemIdsToUpdate);

    if (updateError) {
      throw new Error('Failed to mark items as sold');
    }

    return new Response(
      JSON.stringify({
        success: true,
        itemsSold: items.length,
        coinsEarned: totalValue.toString(),
        newBalance: newBalance.toString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error selling items:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
