import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function pickWeightedRandom(items: any[]) {
  const total = items.reduce((s: number, i: any) => s + Number(i.drop_rate), 0);
  let rand = Math.random() * total;
  for (const item of items) {
    rand -= Number(item.drop_rate);
    if (rand <= 0) return item;
  }
  return items[items.length - 1];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    // POST /case-duel/challenge — create a new duel challenge
    if (req.method === 'POST' && action === 'challenge') {
      const { caseId, opponentId, isBotOpponent } = await req.json();
      if (!caseId) throw new Error('caseId required');

      const { data: caseData } = await supabase
        .from('cases').select('id, name, price, active').eq('id', caseId).single();
      if (!caseData) throw new Error('Case not found');

      const { data: balanceRow } = await supabase
        .from('user_balances').select('balance').eq('user_id', user.id).maybeSingle();
      const currentBalance = Number(balanceRow?.balance ?? 0);
      if (currentBalance < Number(caseData.price)) throw new Error('Insufficient coins');

      const { data: duel, error: duelError } = await supabase
        .from('case_duels')
        .insert({
          challenger_id: user.id,
          opponent_id: isBotOpponent ? null : (opponentId || null),
          is_bot_opponent: !!isBotOpponent,
          case_id: caseId,
          status: isBotOpponent ? 'accepted' : 'pending',
          coins_wagered: Number(caseData.price),
        })
        .select()
        .single();

      if (duelError) throw new Error('Failed to create duel: ' + duelError.message);

      if (!isBotOpponent && opponentId) {
        const { data: challengerProfile } = await supabase
          .from('profiles').select('username, display_name').eq('user_id', user.id).maybeSingle();
        const challengerName = challengerProfile?.display_name || challengerProfile?.username || 'Someone';

        await supabase.from('user_notifications').insert({
          user_id: opponentId,
          title: 'Case Duel Challenge!',
          message: `${challengerName} challenged you to a 1v1 case duel! Open "${caseData.name}" to compete.`,
          category: 'duel',
          is_read: false,
          metadata: { duel_id: duel.id, case_id: caseId, challenger_id: user.id, challenger_name: challengerName, case_name: caseData.name },
        });
      }

      return new Response(JSON.stringify({ success: true, duel }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /case-duel/accept — accept a challenge and both open
    if (req.method === 'POST' && action === 'accept') {
      const { duelId } = await req.json();
      if (!duelId) throw new Error('duelId required');

      const { data: duel } = await supabase
        .from('case_duels').select('*').eq('id', duelId).single();
      if (!duel) throw new Error('Duel not found');
      if (duel.status !== 'pending') throw new Error('Duel is not pending');
      if (duel.opponent_id !== user.id) throw new Error('Not the challenged user');

      const { data: balanceRow } = await supabase
        .from('user_balances').select('balance').eq('user_id', user.id).maybeSingle();
      if (Number(balanceRow?.balance ?? 0) < duel.coins_wagered) throw new Error('Insufficient coins');

      await supabase.from('case_duels').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', duelId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /case-duel/open — open case for a duel (challenger or opponent)
    if (req.method === 'POST' && action === 'open') {
      const { duelId } = await req.json();
      if (!duelId) throw new Error('duelId required');

      const { data: duel } = await supabase
        .from('case_duels').select('*').eq('id', duelId).single();
      if (!duel) throw new Error('Duel not found');
      if (duel.status !== 'accepted') throw new Error('Duel not accepted yet');

      const isChallenger = duel.challenger_id === user.id;
      const isOpponent = duel.opponent_id === user.id;
      if (!isChallenger && !isOpponent) throw new Error('Not a participant');

      if (isChallenger && duel.challenger_item_data) throw new Error('Already opened');
      if (isOpponent && duel.opponent_item_data) throw new Error('Already opened');

      const { data: caseData } = await supabase
        .from('cases').select('id, name, price').eq('id', duel.case_id).single();
      if (!caseData) throw new Error('Case not found');

      const { data: items } = await supabase
        .from('case_items').select('id, item_type, badge_id, global_badge_id, coin_amount, rarity, drop_rate, display_value')
        .eq('case_id', duel.case_id);
      if (!items || items.length === 0) throw new Error('No items in case');

      const { data: balanceRow } = await supabase
        .from('user_balances').select('id, balance, lifetime_spent').eq('user_id', user.id).maybeSingle();
      const currentBalance = Number(balanceRow?.balance ?? 0);
      if (currentBalance < Number(caseData.price)) throw new Error('Insufficient coins');

      const wonItem = pickWeightedRandom(items);

      let globalBadge: any = null;
      if (wonItem.global_badge_id) {
        const { data: gb } = await supabase
          .from('global_badges').select('id, name, icon_url, color, rarity').eq('id', wonItem.global_badge_id).maybeSingle();
        globalBadge = gb;
      }

      const itemData = {
        id: wonItem.id,
        item_type: wonItem.item_type,
        badge_id: wonItem.badge_id,
        global_badge_id: wonItem.global_badge_id,
        coin_amount: wonItem.coin_amount ? Number(wonItem.coin_amount) : null,
        rarity: wonItem.rarity,
        display_value: Number(wonItem.display_value),
        badge: globalBadge || null,
      };

      let newBalance = currentBalance - Number(caseData.price);
      if (wonItem.item_type === 'coins' && wonItem.coin_amount) {
        newBalance += Number(wonItem.coin_amount);
      }

      await supabase.from('user_balances').update({
        balance: newBalance,
        lifetime_spent: Number(balanceRow?.lifetime_spent ?? 0) + Number(caseData.price),
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);

      await supabase.from('user_inventory').insert({
        user_id: user.id,
        item_type: wonItem.item_type,
        item_id: wonItem.global_badge_id || wonItem.badge_id || null,
        item_data: itemData,
        quantity: 1,
      });

      const updatePayload: any = isChallenger
        ? { challenger_item_data: itemData }
        : { opponent_item_data: itemData };

      await supabase.from('case_duels').update(updatePayload).eq('id', duelId);

      const { data: freshDuel } = await supabase
        .from('case_duels').select('*').eq('id', duelId).single();

      let updatedDuel = freshDuel;

      if (duel.is_bot_opponent && isChallenger) {
        const botItem = pickWeightedRandom(items);
        let botGlobalBadge: any = null;
        if (botItem.global_badge_id) {
          const { data: gb } = await supabase
            .from('global_badges').select('id, name, icon_url, color, rarity').eq('id', botItem.global_badge_id).maybeSingle();
          botGlobalBadge = gb;
        }
        const botItemData = {
          id: botItem.id,
          item_type: botItem.item_type,
          badge_id: botItem.badge_id,
          global_badge_id: botItem.global_badge_id,
          coin_amount: botItem.coin_amount ? Number(botItem.coin_amount) : null,
          rarity: botItem.rarity,
          display_value: Number(botItem.display_value),
          badge: botGlobalBadge || null,
        };

        const userValue = Number(itemData.display_value);
        const botValue = Number(botItemData.display_value);
        const userWon = userValue > botValue;
        const tie = userValue === botValue;

        await supabase.from('case_duels').update({
          opponent_item_data: botItemData,
          status: 'completed',
          completed_at: new Date().toISOString(),
          winner_id: userWon ? user.id : null,
          bot_won: !userWon && !tie,
        }).eq('id', duelId);

        const { data: completedDuel } = await supabase.from('case_duels').select('*').eq('id', duelId).single();
        updatedDuel = completedDuel;

        if (userWon) {
          await supabase.from('user_balances').update({
            balance: newBalance + botValue,
            updated_at: new Date().toISOString(),
          }).eq('user_id', user.id);
        }
      } else if (!duel.is_bot_opponent && freshDuel?.challenger_item_data && freshDuel?.opponent_item_data) {
        const cv = Number(freshDuel.challenger_item_data.display_value);
        const ov = Number(freshDuel.opponent_item_data.display_value);
        const winnerId = cv > ov ? duel.challenger_id : (ov > cv ? duel.opponent_id : null);
        const tie = cv === ov;

        await supabase.from('case_duels').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          winner_id: winnerId,
        }).eq('id', duelId);

        const { data: completedDuel } = await supabase.from('case_duels').select('*').eq('id', duelId).single();
        updatedDuel = completedDuel;

        if (!tie && winnerId) {
          const loserValue = winnerId === duel.challenger_id ? ov : cv;
          const { data: winnerBalance } = await supabase
            .from('user_balances').select('balance').eq('user_id', winnerId).maybeSingle();
          await supabase.from('user_balances').update({
            balance: Number(winnerBalance?.balance ?? 0) + loserValue,
            updated_at: new Date().toISOString(),
          }).eq('user_id', winnerId);

          const { data: winnerProfile } = await supabase
            .from('profiles').select('display_name, username').eq('user_id', winnerId).maybeSingle();
          const winnerName = winnerProfile?.display_name || winnerProfile?.username || 'Your opponent';
          const loserId = winnerId === duel.challenger_id ? duel.opponent_id : duel.challenger_id;

          await supabase.from('user_notifications').insert({
            user_id: loserId,
            title: 'Duel Result',
            message: `${winnerName} beat you in the case duel. Better luck next time!`,
            category: 'duel',
            is_read: false,
            metadata: { duel_id: duelId },
          });

          await supabase.from('user_notifications').insert({
            user_id: winnerId,
            title: 'Duel Won!',
            message: `You won the case duel and earned bonus coins!`,
            category: 'duel',
            is_read: false,
            metadata: { duel_id: duelId },
          });
        }
      }

      return new Response(JSON.stringify({ success: true, item: itemData, duel: updatedDuel, newBalance }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /case-duel/decline — decline a challenge
    if (req.method === 'POST' && action === 'decline') {
      const { duelId } = await req.json();
      const { data: duel } = await supabase
        .from('case_duels').select('*').eq('id', duelId).single();
      if (!duel) throw new Error('Duel not found');
      if (duel.opponent_id !== user.id) throw new Error('Not the challenged user');

      await supabase.from('case_duels').update({ status: 'declined' }).eq('id', duelId);

      await supabase.from('user_notifications').insert({
        user_id: duel.challenger_id,
        title: 'Duel Declined',
        message: 'Your duel challenge was declined.',
        category: 'duel',
        is_read: false,
        metadata: { duel_id: duelId },
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /case-duel/list — list user's duels
    if (req.method === 'GET' && action === 'list') {
      const { data: duels } = await supabase
        .from('case_duels')
        .select('*')
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(20);

      return new Response(JSON.stringify({ duels: duels || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Unknown action');

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
