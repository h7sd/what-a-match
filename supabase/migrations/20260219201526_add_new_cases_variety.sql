/*
  # Add New Diverse Cases

  ## Overview
  Adds 6 new themed cases with varied item pools including coins, badges, and premium keys.
  Each case has a unique theme, gradient, price point, and mix of items.

  ## New Cases
  1. Cyber Case (750 coins) - Tech/cyber aesthetic with mid-tier rewards
  2. Prestige Case (3000 coins) - High-value rewards with rare badges
  3. Daily Case (50 coins) - Cheap entry case for daily plays
  4. Neon Case (1500 coins) - Neon aesthetic with flashy items
  5. Shadow Case (5000 coins) - Dark theme, high-value rewards
  6. Galaxy Case (25000 coins) - Ultra-premium, highest tier rewards
*/

DO $$
DECLARE
  cyber_id uuid := gen_random_uuid();
  prestige_id uuid := gen_random_uuid();
  daily_id uuid := gen_random_uuid();
  neon_id uuid := gen_random_uuid();
  shadow_id uuid := gen_random_uuid();
  galaxy_id uuid := gen_random_uuid();
BEGIN

  -- 1. Daily Case (50 coins) - cheap, beginner friendly
  INSERT INTO cases (id, name, description, gradient_css, accent_color, price, active, order_index)
  VALUES (
    daily_id,
    'Daily Case',
    'A free-to-enter case for daily players. Small rewards but always worth opening.',
    'linear-gradient(135deg, #0a2010 0%, #0d3a1a 50%, #0a2010 100%)',
    '#4ade80',
    50,
    true,
    5
  );

  INSERT INTO case_items (case_id, item_type, global_badge_id, coin_amount, rarity, drop_rate, display_value)
  VALUES
    (daily_id, 'coins', null, 25, 'common', 35.0, 25),
    (daily_id, 'coins', null, 50, 'common', 30.0, 50),
    (daily_id, 'coins', null, 100, 'uncommon', 15.0, 100),
    (daily_id, 'coins', null, 200, 'uncommon', 10.0, 200),
    (daily_id, 'badge', 'c1000001-0000-0000-0000-000000000001', null, 'common', 5.0, 300),
    (daily_id, 'badge', 'c1000001-0000-0000-0000-000000000002', null, 'common', 3.0, 500),
    (daily_id, 'coins', null, 500, 'rare', 1.5, 500),
    (daily_id, 'badge', 'ac596906-b9ff-4f11-8e97-c4b06e966329', null, 'rare', 0.4, 2000),
    (daily_id, 'premium_key', null, null, 'premium', 0.1, 50000);

  -- 2. Cyber Case (750 coins) - mid-tier, tech aesthetic
  INSERT INTO cases (id, name, description, gradient_css, accent_color, price, active, order_index)
  VALUES (
    cyber_id,
    'Cyber Case',
    'Tech-themed case packed with digital treasures. Hack the system for big rewards.',
    'linear-gradient(135deg, #001520 0%, #002535 50%, #001a28 100%)',
    '#00d4ff',
    750,
    true,
    6
  );

  INSERT INTO case_items (case_id, item_type, global_badge_id, coin_amount, rarity, drop_rate, display_value)
  VALUES
    (cyber_id, 'coins', null, 300, 'common', 30.0, 300),
    (cyber_id, 'coins', null, 600, 'common', 20.0, 600),
    (cyber_id, 'badge', 'c1000001-0000-0000-0000-000000000001', null, 'common', 15.0, 400),
    (cyber_id, 'coins', null, 1200, 'uncommon', 12.0, 1200),
    (cyber_id, 'badge', 'c1000001-0000-0000-0000-000000000005', null, 'rare', 10.0, 3000),
    (cyber_id, 'coins', null, 2500, 'rare', 7.0, 2500),
    (cyber_id, 'badge', 'c1000001-0000-0000-0000-000000000007', null, 'epic', 4.0, 8000),
    (cyber_id, 'coins', null, 5000, 'epic', 1.5, 5000),
    (cyber_id, 'badge', 'c1000001-0000-0000-0000-000000000009', null, 'legendary', 0.4, 25000),
    (cyber_id, 'premium_key', null, null, 'premium', 0.1, 50000);

  -- 3. Neon Case (1500 coins) - flashy, colorful
  INSERT INTO cases (id, name, description, gradient_css, accent_color, price, active, order_index)
  VALUES (
    neon_id,
    'Neon Case',
    'Electrifying drops in vivid neon colors. Feel the rush of bright rewards.',
    'linear-gradient(135deg, #1a0025 0%, #280040 50%, #1a0025 100%)',
    '#e040fb',
    1500,
    true,
    7
  );

  INSERT INTO case_items (case_id, item_type, global_badge_id, coin_amount, rarity, drop_rate, display_value)
  VALUES
    (neon_id, 'coins', null, 500, 'common', 25.0, 500),
    (neon_id, 'coins', null, 1000, 'common', 20.0, 1000),
    (neon_id, 'badge', 'c1000001-0000-0000-0000-000000000002', null, 'common', 15.0, 600),
    (neon_id, 'coins', null, 2000, 'uncommon', 13.0, 2000),
    (neon_id, 'badge', 'c1000001-0000-0000-0000-000000000006', null, 'rare', 10.0, 4000),
    (neon_id, 'coins', null, 4000, 'rare', 8.0, 4000),
    (neon_id, 'badge', 'c1000001-0000-0000-0000-000000000008', null, 'epic', 5.0, 10000),
    (neon_id, 'coins', null, 8000, 'epic', 3.0, 8000),
    (neon_id, 'badge', 'c1000001-0000-0000-0000-000000000010', null, 'legendary', 0.8, 30000),
    (neon_id, 'badge', 'c1000001-0000-0000-0000-000000000011', null, 'legendary', 0.1, 40000),
    (neon_id, 'premium_key', null, null, 'premium', 0.1, 50000);

  -- 4. Prestige Case (3000 coins) - high value
  INSERT INTO cases (id, name, description, gradient_css, accent_color, price, active, order_index)
  VALUES (
    prestige_id,
    'Prestige Case',
    'For the elite. Contains the rarest badges and massive coin jackpots.',
    'linear-gradient(135deg, #1a0f00 0%, #2d1e00 50%, #1a0f00 100%)',
    '#f59e0b',
    3000,
    true,
    8
  );

  INSERT INTO case_items (case_id, item_type, global_badge_id, coin_amount, rarity, drop_rate, display_value)
  VALUES
    (prestige_id, 'coins', null, 1000, 'common', 25.0, 1000),
    (prestige_id, 'coins', null, 2500, 'uncommon', 18.0, 2500),
    (prestige_id, 'badge', 'c1000001-0000-0000-0000-000000000001', null, 'common', 15.0, 500),
    (prestige_id, 'coins', null, 5000, 'rare', 14.0, 5000),
    (prestige_id, 'badge', 'ac596906-b9ff-4f11-8e97-c4b06e966329', null, 'rare', 10.0, 4000),
    (prestige_id, 'badge', '22e7ebcc-8a9f-4f8e-91c6-48c7babc0039', null, 'epic', 8.0, 12000),
    (prestige_id, 'coins', null, 10000, 'epic', 6.0, 10000),
    (prestige_id, 'badge', 'c1000001-0000-0000-0000-000000000011', null, 'legendary', 2.0, 40000),
    (prestige_id, 'coins', null, 20000, 'legendary', 1.5, 20000),
    (prestige_id, 'badge', 'a2372b53-825f-49c9-b386-c4a4e02bd97d', null, 'legendary', 0.4, 60000),
    (prestige_id, 'premium_key', null, null, 'premium', 0.1, 50000);

  -- 5. Shadow Case (5000 coins) - dark, high stakes
  INSERT INTO cases (id, name, description, gradient_css, accent_color, price, active, order_index)
  VALUES (
    shadow_id,
    'Shadow Case',
    'Only for the brave. High risk, high reward. Legendary drops await in the dark.',
    'linear-gradient(135deg, #050508 0%, #0d0d18 50%, #050508 100%)',
    '#6366f1',
    5000,
    true,
    9
  );

  INSERT INTO case_items (case_id, item_type, global_badge_id, coin_amount, rarity, drop_rate, display_value)
  VALUES
    (shadow_id, 'coins', null, 2000, 'common', 20.0, 2000),
    (shadow_id, 'coins', null, 5000, 'uncommon', 18.0, 5000),
    (shadow_id, 'badge', 'c1000001-0000-0000-0000-000000000005', null, 'rare', 15.0, 5000),
    (shadow_id, 'coins', null, 10000, 'rare', 15.0, 10000),
    (shadow_id, 'badge', 'c1000001-0000-0000-0000-000000000006', null, 'rare', 12.0, 6000),
    (shadow_id, 'badge', 'c1000001-0000-0000-0000-000000000007', null, 'epic', 10.0, 15000),
    (shadow_id, 'coins', null, 20000, 'epic', 5.0, 20000),
    (shadow_id, 'badge', 'c1000001-0000-0000-0000-000000000012', null, 'legendary', 3.0, 50000),
    (shadow_id, 'badge', 'c1000001-0000-0000-0000-000000000009', null, 'legendary', 1.5, 45000),
    (shadow_id, 'coins', null, 40000, 'legendary', 0.3, 40000),
    (shadow_id, 'premium_key', null, null, 'premium', 0.2, 50000);

  -- 6. Galaxy Case (25000 coins) - ultra premium
  INSERT INTO cases (id, name, description, gradient_css, accent_color, price, active, order_index)
  VALUES (
    galaxy_id,
    'Galaxy Case',
    'The ultimate case. Absurd jackpots and the rarest badges in the universe.',
    'linear-gradient(135deg, #000010 0%, #00001a 30%, #000028 60%, #000010 100%)',
    '#ffd700',
    25000,
    true,
    10
  );

  INSERT INTO case_items (case_id, item_type, global_badge_id, coin_amount, rarity, drop_rate, display_value)
  VALUES
    (galaxy_id, 'coins', null, 10000, 'common', 20.0, 10000),
    (galaxy_id, 'coins', null, 25000, 'uncommon', 18.0, 25000),
    (galaxy_id, 'badge', 'c1000001-0000-0000-0000-000000000005', null, 'rare', 14.0, 8000),
    (galaxy_id, 'coins', null, 50000, 'rare', 13.0, 50000),
    (galaxy_id, 'badge', 'c1000001-0000-0000-0000-000000000008', null, 'epic', 12.0, 20000),
    (galaxy_id, 'badge', 'c1000001-0000-0000-0000-000000000007', null, 'epic', 10.0, 18000),
    (galaxy_id, 'coins', null, 100000, 'epic', 6.0, 100000),
    (galaxy_id, 'badge', 'c1000001-0000-0000-0000-000000000010', null, 'legendary', 4.0, 60000),
    (galaxy_id, 'badge', 'c1000001-0000-0000-0000-000000000011', null, 'legendary', 2.0, 80000),
    (galaxy_id, 'badge', 'c1000001-0000-0000-0000-000000000012', null, 'legendary', 0.5, 100000),
    (galaxy_id, 'coins', null, 250000, 'legendary', 0.3, 250000),
    (galaxy_id, 'premium_key', null, null, 'premium', 0.2, 50000);

END $$;
