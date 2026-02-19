import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CaseItem {
  id: string;
  item_type: 'badge' | 'coins' | 'premium_key';
  badge_id: string | null;
  global_badge_id: string | null;
  coin_amount: number | null;
  rarity: string;
  drop_rate: number;
  display_value: number;
  badge?: {
    name: string;
    icon_url: string;
    color: string;
  } | null;
  global_badge?: {
    name: string;
    icon_url: string;
    color: string;
  } | null;
}

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

    const { caseId } = await req.json();

    if (!caseId) {
      throw new Error('Case ID is required');
    }

    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .eq('active', true)
      .single();

    if (caseError || !caseData) {
      throw new Error('Case not found or inactive');
    }

    // Use user_balances table (keyed by user_id = auth user id)
    const { data: balanceRow, error: balanceReadError } = await supabase
      .from('user_balances')
      .select('id, balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (balanceReadError) {
      throw new Error('Failed to read balance');
    }

    const currentBalance = balanceRow ? BigInt(balanceRow.balance) : BigInt(0);
    const casePrice = BigInt(caseData.price);

    if (currentBalance < casePrice) {
      throw new Error('Insufficient coins');
    }

    const { data: items, error: itemsError } = await supabase
      .from('case_items')
      .select(`
        id,
        item_type,
        badge_id,
        global_badge_id,
        coin_amount,
        rarity,
        drop_rate,
        display_value,
        badge:badge_id (
          name,
          icon_url,
          color
        ),
        global_badge:global_badge_id (
          name,
          icon_url,
          color
        )
      `)
      .eq('case_id', caseId);

    if (itemsError || !items || items.length === 0) {
      throw new Error('No items found in case');
    }

    const totalDropRate = items.reduce((sum, item) => sum + parseFloat(item.drop_rate.toString()), 0);
    const random = Math.random() * totalDropRate;

    let cumulativeRate = 0;
    let wonItem: CaseItem | null = null;

    for (const item of items) {
      cumulativeRate += parseFloat(item.drop_rate.toString());
      if (random <= cumulativeRate) {
        wonItem = item as CaseItem;
        break;
      }
    }

    if (!wonItem) {
      wonItem = items[items.length - 1] as CaseItem;
    }

    let newBalance = currentBalance - casePrice;

    if (wonItem.item_type === 'coins' && wonItem.coin_amount) {
      newBalance = newBalance + BigInt(wonItem.coin_amount);
    }

    // Upsert balance in user_balances
    if (balanceRow) {
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({
          balance: newBalance.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error('Failed to update balance');
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_balances')
        .insert({
          user_id: user.id,
          balance: newBalance.toString(),
          lifetime_earned: wonItem.item_type === 'coins' ? (wonItem.coin_amount || 0).toString() : '0',
          lifetime_spent: caseData.price,
        });

      if (insertError) {
        throw new Error('Failed to create balance');
      }
    }

    const resolvedBadge = wonItem.badge || wonItem.global_badge || null;

    const itemWonData = {
      id: wonItem.id,
      item_type: wonItem.item_type,
      badge_id: wonItem.badge_id,
      global_badge_id: wonItem.global_badge_id,
      coin_amount: wonItem.coin_amount,
      rarity: wonItem.rarity,
      display_value: wonItem.display_value,
      badge: resolvedBadge,
    };

    await supabase
      .from('user_inventory')
      .insert({
        user_id: user.id,
        item_type: wonItem.item_type,
        badge_id: wonItem.badge_id,
        coin_amount: wonItem.coin_amount,
        rarity: wonItem.rarity,
        estimated_value: wonItem.display_value,
        won_from_case_id: caseId,
      });

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const displayUsername = userProfile?.display_name || userProfile?.username || 'Anonymous';

    let itemName = '';
    if (wonItem.item_type === 'coins') {
      itemName = `${wonItem.coin_amount} Coins`;
    } else if (wonItem.item_type === 'premium_key') {
      itemName = 'Premium Key';
    } else if (resolvedBadge) {
      itemName = resolvedBadge.name;
    } else {
      itemName = 'Mystery Item';
    }

    await supabase
      .from('case_transactions')
      .insert({
        user_id: user.id,
        case_id: caseId,
        transaction_type: 'open',
        items_won: [itemWonData],
        total_value: wonItem.display_value,
      });

    await supabase
      .from('case_opening_history')
      .insert({
        user_id: user.id,
        case_id: caseId,
        coins_spent: parseInt(casePrice.toString()),
      });

    await supabase
      .from('live_feed')
      .insert({
        user_id: user.id,
        username: displayUsername,
        case_name: caseData.name,
        item_name: itemName,
        item_rarity: wonItem.rarity,
        item_value: wonItem.display_value,
      });

    return new Response(
      JSON.stringify({
        success: true,
        item: itemWonData,
        newBalance: newBalance.toString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error opening case:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
