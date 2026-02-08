-- Quick seed script to populate cases
-- Run this in your Supabase SQL Editor

-- First, check if cases already exist
DO $$
BEGIN
  -- Insert sample cases if they don't exist
  IF NOT EXISTS (SELECT 1 FROM cases WHERE name = 'Starter Case') THEN
    INSERT INTO cases (name, description, price, active, order_index)
    VALUES
      ('Starter Case', 'Perfect for beginners! Contains common items and small coin rewards.', 100, true, 1),
      ('Premium Case', 'Step up your game with rare and epic items plus decent coin rewards.', 500, true, 2),
      ('Legendary Case', 'For the serious collector! High chance of legendary badges and big wins.', 2000, true, 3),
      ('Ultimate Case', 'The pinnacle of luxury. Premium badges and massive coin rewards await!', 10000, true, 4);
  END IF;
END $$;

-- Insert coin items for each case
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

  -- Delete existing items to avoid duplicates
  DELETE FROM case_items WHERE case_id IN (starter_case_id, premium_case_id, legendary_case_id, ultimate_case_id);

  -- Starter Case Items
  INSERT INTO case_items (case_id, item_type, coin_amount, rarity, drop_rate, display_value)
  VALUES
    (starter_case_id, 'coins', 5, 'common', 30.0, 5),
    (starter_case_id, 'coins', 10, 'common', 20.0, 10),
    (starter_case_id, 'coins', 20, 'common', 15.0, 20),
    (starter_case_id, 'coins', 50, 'rare', 10.0, 50),
    (starter_case_id, 'coins', 100, 'rare', 5.0, 100),
    (starter_case_id, 'coins', 200, 'epic', 2.0, 200),
    (starter_case_id, 'coins', 500, 'legendary', 0.5, 500);

  -- Premium Case Items
  INSERT INTO case_items (case_id, item_type, coin_amount, rarity, drop_rate, display_value)
  VALUES
    (premium_case_id, 'coins', 50, 'common', 25.0, 50),
    (premium_case_id, 'coins', 100, 'common', 20.0, 100),
    (premium_case_id, 'coins', 200, 'rare', 15.0, 200),
    (premium_case_id, 'coins', 500, 'rare', 10.0, 500),
    (premium_case_id, 'coins', 1000, 'epic', 5.0, 1000),
    (premium_case_id, 'coins', 2000, 'legendary', 2.0, 2000);

  -- Legendary Case Items
  INSERT INTO case_items (case_id, item_type, coin_amount, rarity, drop_rate, display_value)
  VALUES
    (legendary_case_id, 'coins', 100, 'common', 20.0, 100),
    (legendary_case_id, 'coins', 500, 'common', 15.0, 500),
    (legendary_case_id, 'coins', 1000, 'rare', 12.0, 1000),
    (legendary_case_id, 'coins', 2000, 'rare', 10.0, 2000),
    (legendary_case_id, 'coins', 5000, 'epic', 6.0, 5000),
    (legendary_case_id, 'coins', 10000, 'legendary', 3.0, 10000);

  -- Ultimate Case Items
  INSERT INTO case_items (case_id, item_type, coin_amount, rarity, drop_rate, display_value)
  VALUES
    (ultimate_case_id, 'coins', 1000, 'common', 18.0, 1000),
    (ultimate_case_id, 'coins', 5000, 'common', 15.0, 5000),
    (ultimate_case_id, 'coins', 10000, 'rare', 12.0, 10000),
    (ultimate_case_id, 'coins', 20000, 'rare', 10.0, 20000),
    (ultimate_case_id, 'coins', 50000, 'epic', 7.0, 50000),
    (ultimate_case_id, 'coins', 100000, 'legendary', 4.0, 100000),
    (ultimate_case_id, 'coins', 500000, 'premium', 1.0, 500000);

END $$;

-- Verify the data
SELECT
  c.name as case_name,
  c.price,
  COUNT(ci.id) as num_items,
  SUM(ci.drop_rate) as total_drop_rate
FROM cases c
LEFT JOIN case_items ci ON ci.case_id = c.id
WHERE c.active = true
GROUP BY c.id, c.name, c.price
ORDER BY c.order_index;
