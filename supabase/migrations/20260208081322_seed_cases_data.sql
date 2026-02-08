/*
  # Seed Data for Case Opening System

  Inserts sample cases and items for testing:
  
  1. Starter Case (100 UC) - Common items and small coin rewards
  2. Premium Case (500 UC) - Mix of rare and epic items
  3. Legendary Case (2000 UC) - High chance of legendary items
  4. Ultimate Case (10000 UC) - Premium badges and huge coin rewards
  
  Items include:
  - Various coin amounts (5, 10, 20, 50, 100, 500, 1000, 10000)
  - Badges from different rarities
*/

-- Insert sample cases
INSERT INTO cases (name, description, price, active, order_index, image_url)
VALUES
  (
    'Starter Case',
    'Perfect for beginners! Contains common items and small coin rewards.',
    100,
    true,
    1,
    null
  ),
  (
    'Premium Case',
    'Step up your game with rare and epic items plus decent coin rewards.',
    500,
    true,
    2,
    null
  ),
  (
    'Legendary Case',
    'For the serious collector! High chance of legendary badges and big wins.',
    2000,
    true,
    3,
    null
  ),
  (
    'Ultimate Case',
    'The pinnacle of luxury. Premium badges and massive coin rewards await!',
    10000,
    true,
    4,
    null
  )
ON CONFLICT DO NOTHING;

-- Get the badge IDs (we'll need existing badges from the system)
DO $$
DECLARE
  starter_case_id uuid;
  premium_case_id uuid;
  legendary_case_id uuid;
  ultimate_case_id uuid;
BEGIN
  -- Get case IDs
  SELECT id INTO starter_case_id FROM cases WHERE name = 'Starter Case';
  SELECT id INTO premium_case_id FROM cases WHERE name = 'Premium Case';
  SELECT id INTO legendary_case_id FROM cases WHERE name = 'Legendary Case';
  SELECT id INTO ultimate_case_id FROM cases WHERE name = 'Ultimate Case';

  -- Starter Case Items (100 UC)
  -- Coins: 60% total, Common badges: 35%, Rare: 4.5%, Epic: 0.4%, Legendary: 0.09%, Premium: 0.01%
  INSERT INTO case_items (case_id, item_type, coin_amount, rarity, drop_rate, display_value)
  VALUES
    (starter_case_id, 'coins', 5, 'common', 30.0, 5),
    (starter_case_id, 'coins', 10, 'common', 20.0, 10),
    (starter_case_id, 'coins', 20, 'common', 8.0, 20),
    (starter_case_id, 'coins', 50, 'rare', 1.8, 50),
    (starter_case_id, 'coins', 100, 'rare', 0.2, 100)
  ON CONFLICT DO NOTHING;

  -- Add badge items for Starter Case (need to use existing badges)
  INSERT INTO case_items (case_id, item_type, badge_id, rarity, drop_rate, display_value)
  SELECT
    starter_case_id,
    'badge',
    b.id,
    'common',
    35.0 / COUNT(*) OVER (),
    150
  FROM badges b
  WHERE b.name IN ('Early Supporter', 'Helper')
  LIMIT 2
  ON CONFLICT DO NOTHING;

  INSERT INTO case_items (case_id, item_type, badge_id, rarity, drop_rate, display_value)
  SELECT
    starter_case_id,
    'badge',
    b.id,
    'rare',
    4.5 / COUNT(*) OVER (),
    400
  FROM badges b
  WHERE b.name IN ('Donor', 'Developer')
  LIMIT 2
  ON CONFLICT DO NOTHING;

  -- Premium Case Items (500 UC)
  INSERT INTO case_items (case_id, item_type, coin_amount, rarity, drop_rate, display_value)
  VALUES
    (premium_case_id, 'coins', 50, 'common', 15.0, 50),
    (premium_case_id, 'coins', 100, 'common', 12.0, 100),
    (premium_case_id, 'coins', 200, 'rare', 8.0, 200),
    (premium_case_id, 'coins', 500, 'rare', 3.0, 500),
    (premium_case_id, 'coins', 1000, 'epic', 1.0, 1000)
  ON CONFLICT DO NOTHING;

  INSERT INTO case_items (case_id, item_type, badge_id, rarity, drop_rate, display_value)
  SELECT
    premium_case_id,
    'badge',
    b.id,
    'common',
    20.0 / COUNT(*) OVER (),
    300
  FROM badges b
  WHERE b.name IN ('Early Supporter', 'Helper')
  LIMIT 2
  ON CONFLICT DO NOTHING;

  INSERT INTO case_items (case_id, item_type, badge_id, rarity, drop_rate, display_value)
  SELECT
    premium_case_id,
    'badge',
    b.id,
    'rare',
    25.0 / COUNT(*) OVER (),
    800
  FROM badges b
  WHERE b.name IN ('Donor', 'Developer')
  LIMIT 2
  ON CONFLICT DO NOTHING;

  INSERT INTO case_items (case_id, item_type, badge_id, rarity, drop_rate, display_value)
  SELECT
    premium_case_id,
    'badge',
    b.id,
    'epic',
    15.0 / COUNT(*) OVER (),
    2000
  FROM badges b
  WHERE b.name = 'Staff'
  LIMIT 1
  ON CONFLICT DO NOTHING;

  -- Legendary Case Items (2000 UC)
  INSERT INTO case_items (case_id, item_type, coin_amount, rarity, drop_rate, display_value)
  VALUES
    (legendary_case_id, 'coins', 100, 'common', 8.0, 100),
    (legendary_case_id, 'coins', 500, 'rare', 10.0, 500),
    (legendary_case_id, 'coins', 1000, 'rare', 8.0, 1000),
    (legendary_case_id, 'coins', 5000, 'epic', 3.0, 5000),
    (legendary_case_id, 'coins', 10000, 'legendary', 0.5, 10000)
  ON CONFLICT DO NOTHING;

  INSERT INTO case_items (case_id, item_type, badge_id, rarity, drop_rate, display_value)
  SELECT
    legendary_case_id,
    'badge',
    b.id,
    'rare',
    15.0 / COUNT(*) OVER (),
    1500
  FROM badges b
  WHERE b.name IN ('Donor', 'Developer')
  LIMIT 2
  ON CONFLICT DO NOTHING;

  INSERT INTO case_items (case_id, item_type, badge_id, rarity, drop_rate, display_value)
  SELECT
    legendary_case_id,
    'badge',
    b.id,
    'epic',
    30.0 / COUNT(*) OVER (),
    4000
  FROM badges b
  WHERE b.name = 'Staff'
  LIMIT 1
  ON CONFLICT DO NOTHING;

  INSERT INTO case_items (case_id, item_type, badge_id, rarity, drop_rate, display_value)
  SELECT
    legendary_case_id,
    'badge',
    b.id,
    'legendary',
    25.0 / COUNT(*) OVER (),
    8000
  FROM badges b
  WHERE b.name IN ('Staff', 'Developer')
  LIMIT 2
  ON CONFLICT DO NOTHING;

  -- Ultimate Case Items (10000 UC)
  INSERT INTO case_items (case_id, item_type, coin_amount, rarity, drop_rate, display_value)
  VALUES
    (ultimate_case_id, 'coins', 1000, 'common', 5.0, 1000),
    (ultimate_case_id, 'coins', 5000, 'rare', 8.0, 5000),
    (ultimate_case_id, 'coins', 10000, 'rare', 5.0, 10000),
    (ultimate_case_id, 'coins', 50000, 'epic', 2.0, 50000),
    (ultimate_case_id, 'coins', 100000, 'legendary', 0.5, 100000)
  ON CONFLICT DO NOTHING;

  INSERT INTO case_items (case_id, item_type, badge_id, rarity, drop_rate, display_value)
  SELECT
    ultimate_case_id,
    'badge',
    b.id,
    'epic',
    20.0 / COUNT(*) OVER (),
    15000
  FROM badges b
  WHERE b.name = 'Staff'
  LIMIT 1
  ON CONFLICT DO NOTHING;

  INSERT INTO case_items (case_id, item_type, badge_id, rarity, drop_rate, display_value)
  SELECT
    ultimate_case_id,
    'badge',
    b.id,
    'legendary',
    40.0 / COUNT(*) OVER (),
    30000
  FROM badges b
  WHERE b.name IN ('Staff', 'Developer')
  LIMIT 2
  ON CONFLICT DO NOTHING;

  INSERT INTO case_items (case_id, item_type, badge_id, rarity, drop_rate, display_value)
  SELECT
    ultimate_case_id,
    'badge',
    b.id,
    'premium',
    19.5 / COUNT(*) OVER (),
    100000
  FROM badges b
  WHERE b.name IN ('Staff', 'Developer')
  LIMIT 2
  ON CONFLICT DO NOTHING;

END $$;
