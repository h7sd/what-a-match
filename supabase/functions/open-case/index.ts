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

    const { caseId } = await req.json();
    if (!caseId) throw new Error('Case ID is required');

    // Load case
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id, name, price, active')
      .eq('id', caseId)
      .eq('active', true)
      .single();
    if (caseError || !caseData) throw new Error('Case not found');

    const casePrice = BigInt(caseData.price);

    // Load balance
    const { data: balanceRow, error: balanceReadError } = await supabase
      .from('user_balances')
      .select('id, balance, lifetime_earned, lifetime_spent')
      .eq('user_id', user.id)
      .maybeSingle();
    if (balanceReadError) throw new Error('Failed to read balance: ' + balanceReadError.message);

    const currentBalance = BigInt(balanceRow?.balance ?? 0);
    if (currentBalance < casePrice) throw new Error('Insufficient coins');

    // Load case items with global badge data
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
        global_badge:global_badge_id (
          id,
          name,
          icon_url,
          color,
          rarity
        )
      `)
      .eq('case_id', caseId);

    if (itemsError) throw new Error('Failed to load items: ' + itemsError.message);
    if (!items || items.length === 0) throw new Error('No items in case');

    // Pick random item by drop rate
    const totalDropRate = items.reduce((sum: number, item: any) => sum + Number(item.drop_rate), 0);
    const random = Math.random() * totalDropRate;

    let cumulative = 0;
    let wonItem: any = null;
    for (const item of items) {
      cumulative += Number(item.drop_rate);
      if (random <= cumulative) {
        wonItem = item;
        break;
      }
    }
    if (!wonItem) wonItem = items[items.length - 1];

    // Calculate new balance using BigInt
    let newBalance = currentBalance - casePrice;
    if (wonItem.item_type === 'coins' && wonItem.coin_amount) {
      newBalance = newBalance + BigInt(wonItem.coin_amount);
    }

    // Update or create balance row — store as string to preserve bigint precision
    if (balanceRow) {
      const newSpent = BigInt(balanceRow.lifetime_spent ?? 0) + casePrice;
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({
          balance: newBalance.toString(),
          lifetime_spent: newSpent.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      if (updateError) throw new Error('Failed to update balance: ' + updateError.message);
    } else {
      const { error: insertError } = await supabase
        .from('user_balances')
        .insert({
          user_id: user.id,
          balance: newBalance.toString(),
          lifetime_earned: '0',
          lifetime_spent: casePrice.toString(),
        });
      if (insertError) throw new Error('Failed to create balance: ' + insertError.message);
    }

    const globalBadge = Array.isArray(wonItem.global_badge)
      ? wonItem.global_badge[0]
      : wonItem.global_badge;

    const itemWonData = {
      id: wonItem.id,
      item_type: wonItem.item_type,
      badge_id: wonItem.badge_id,
      global_badge_id: wonItem.global_badge_id,
      coin_amount: wonItem.coin_amount ? Number(wonItem.coin_amount) : null,
      rarity: wonItem.rarity,
      display_value: Number(wonItem.display_value),
      badge: globalBadge || null,
    };

    // Insert to user_inventory
    const { error: inventoryError } = await supabase
      .from('user_inventory')
      .insert({
        user_id: user.id,
        item_type: wonItem.item_type,
        item_id: wonItem.global_badge_id || wonItem.badge_id || null,
        item_data: itemWonData,
        quantity: 1,
      });
    if (inventoryError) {
      console.error('Inventory insert error (non-fatal):', inventoryError.message);
    }

    // Get profile display name for live feed
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const displayUsername = userProfile?.display_name || userProfile?.username || 'Anonymous';

    let itemName = '';
    if (wonItem.item_type === 'coins') {
      itemName = `${Number(wonItem.coin_amount)} Coins`;
    } else if (wonItem.item_type === 'premium_key') {
      itemName = 'Premium Key';
    } else if (globalBadge) {
      itemName = globalBadge.name;
    } else {
      itemName = 'Mystery Item';
    }

    // Record transaction
    await supabase.from('case_transactions').insert({
      user_id: user.id,
      case_id: caseId,
      transaction_type: 'open',
      items_won: [itemWonData],
      total_value: Number(wonItem.display_value),
    });

    // Record opening history
    await supabase.from('case_opening_history').insert({
      user_id: user.id,
      case_id: caseId,
      item_won_id: wonItem.id,
      coins_spent: Number(casePrice),
    });

    // Record in live feed
    await supabase.from('live_feed').insert({
      user_id: user.id,
      username: displayUsername,
      case_name: caseData.name,
      item_name: itemName,
      item_rarity: wonItem.rarity,
      item_value: Number(wonItem.display_value),
    });

    return new Response(
      JSON.stringify({ success: true, item: itemWonData, newBalance: newBalance.toString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error opening case:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
