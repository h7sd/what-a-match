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
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const { itemIds, sellAll } = await req.json();
    if (!sellAll && (!itemIds || itemIds.length === 0)) throw new Error('Item IDs required');

    let query = supabase
      .from('user_inventory')
      .select('id, item_data')
      .eq('user_id', user.id);

    if (!sellAll) {
      query = query.in('id', itemIds);
    }

    const { data: items, error: itemsError } = await query;
    if (itemsError || !items || items.length === 0) throw new Error('No items found to sell');

    const totalValue = items.reduce((sum: number, item: any) => {
      const val = item.item_data?.display_value || 0;
      return sum + Number(val);
    }, 0);

    // Update user_balances
    const { data: balanceRow } = await supabase
      .from('user_balances')
      .select('id, balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (balanceRow) {
      await supabase
        .from('user_balances')
        .update({ balance: Number(balanceRow.balance) + totalValue, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('user_balances')
        .insert({ user_id: user.id, balance: totalValue, lifetime_earned: totalValue, lifetime_spent: 0 });
    }

    const itemIdsToDelete = items.map((item: any) => item.id);
    await supabase.from('user_inventory').delete().in('id', itemIdsToDelete);

    return new Response(
      JSON.stringify({ success: true, itemsSold: items.length, coinsEarned: totalValue, newBalance: (Number(balanceRow?.balance ?? 0) + totalValue) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error selling items:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
