-- Seed data for CS2-style case opening system
-- Creates cases and case items with proper drop rates
-- Items reference badge names rather than IDs for flexibility

-- Create cases
INSERT INTO cases (id, name, description, image_url, price, is_premium, active, order_index)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Starter Case', 'Perfect for beginners! Contains coins and common badges.', 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg', 100, false, true, 1),
  ('10000000-0000-0000-0000-000000000002', 'Standard Case', 'Better rewards with a chance at rare badges!', 'https://images.pexels.com/photos/7319070/pexels-photo-7319070.jpeg', 500, false, true, 2),
  ('10000000-0000-0000-0000-000000000003', 'Premium Case', 'High-tier rewards and epic badges await!', 'https://images.pexels.com/photos/7290208/pexels-photo-7290208.jpeg', 2000, false, true, 3),
  ('10000000-0000-0000-0000-000000000004', 'Elite Case', 'Legendary items and massive coin drops!', 'https://images.pexels.com/photos/4439444/pexels-photo-4439444.jpeg', 5000, false, true, 4),
  ('10000000-0000-0000-0000-000000000005', 'Premium Subscription Case', 'Exclusive case with the best odds! Only place to win the #1 Badge!', 'https://images.pexels.com/photos/7290208/pexels-photo-7290208.jpeg', 10000, true, true, 5)
ON CONFLICT (id) DO NOTHING;

-- STARTER CASE ITEMS (100 coins)
-- Drop Rate Distribution: Coins 55%, Common 30%, Rare 15%
INSERT INTO case_items (case_id, item_type, badge_id, coin_amount, rarity, drop_rate, display_value, display_order)
VALUES
  -- Coins (55%)
  ('10000000-0000-0000-0000-000000000001', 'coins', NULL, 5, 'common', 20.00, 5, 1),
  ('10000000-0000-0000-0000-000000000001', 'coins', NULL, 10, 'common', 20.00, 10, 2),
  ('10000000-0000-0000-0000-000000000001', 'coins', NULL, 15, 'common', 15.00, 15, 3),
  -- More coins for variety
  ('10000000-0000-0000-0000-000000000001', 'coins', NULL, 20, 'common', 15.00, 20, 4),
  ('10000000-0000-0000-0000-000000000001', 'coins', NULL, 30, 'rare', 15.00, 30, 5),
  ('10000000-0000-0000-0000-000000000001', 'coins', NULL, 50, 'rare', 10.00, 50, 6),
  ('10000000-0000-0000-0000-000000000001', 'coins', NULL, 100, 'epic', 5.00, 100, 7)
ON CONFLICT DO NOTHING;

-- STANDARD CASE ITEMS (500 coins)
INSERT INTO case_items (case_id, item_type, badge_id, coin_amount, rarity, drop_rate, display_value, display_order)
VALUES
  -- Coins (60%)
  ('10000000-0000-0000-0000-000000000002', 'coins', NULL, 50, 'common', 15.00, 50, 1),
  ('10000000-0000-0000-0000-000000000002', 'coins', NULL, 100, 'common', 15.00, 100, 2),
  ('10000000-0000-0000-0000-000000000002', 'coins', NULL, 200, 'common', 15.00, 200, 3),
  ('10000000-0000-0000-0000-000000000002', 'coins', NULL, 300, 'rare', 10.00, 300, 4),
  ('10000000-0000-0000-0000-000000000002', 'coins', NULL, 500, 'rare', 5.00, 500, 5),
  -- Higher value items
  ('10000000-0000-0000-0000-000000000002', 'coins', NULL, 800, 'epic', 25.00, 800, 6),
  ('10000000-0000-0000-0000-000000000002', 'coins', NULL, 1000, 'epic', 10.00, 1000, 7),
  ('10000000-0000-0000-0000-000000000002', 'coins', NULL, 2000, 'legendary', 5.00, 2000, 8)
ON CONFLICT DO NOTHING;

-- PREMIUM CASE ITEMS (2000 coins)
INSERT INTO case_items (case_id, item_type, badge_id, coin_amount, rarity, drop_rate, display_value, display_order)
VALUES
  -- Coins (55%)
  ('10000000-0000-0000-0000-000000000003', 'coins', NULL, 200, 'common', 10.00, 200, 1),
  ('10000000-0000-0000-0000-000000000003', 'coins', NULL, 500, 'common', 10.00, 500, 2),
  ('10000000-0000-0000-0000-000000000003', 'coins', NULL, 800, 'rare', 10.00, 800, 3),
  ('10000000-0000-0000-0000-000000000003', 'coins', NULL, 1000, 'rare', 10.00, 1000, 4),
  ('10000000-0000-0000-0000-000000000003', 'coins', NULL, 1500, 'rare', 10.00, 1500, 5),
  ('10000000-0000-0000-0000-000000000003', 'coins', NULL, 2000, 'epic', 20.00, 2000, 6),
  ('10000000-0000-0000-0000-000000000003', 'coins', NULL, 3000, 'epic', 15.00, 3000, 7),
  ('10000000-0000-0000-0000-000000000003', 'coins', NULL, 5000, 'legendary', 9.00, 5000, 8),
  ('10000000-0000-0000-0000-000000000003', 'coins', NULL, 10000, 'premium', 1.00, 10000, 9)
ON CONFLICT DO NOTHING;

-- ELITE CASE ITEMS (5000 coins)
INSERT INTO case_items (case_id, item_type, badge_id, coin_amount, rarity, drop_rate, display_value, display_order)
VALUES
  -- High value coins (50%)
  ('10000000-0000-0000-0000-000000000004', 'coins', NULL, 1000, 'common', 10.00, 1000, 1),
  ('10000000-0000-0000-0000-000000000004', 'coins', NULL, 2000, 'rare', 10.00, 2000, 2),
  ('10000000-0000-0000-0000-000000000004', 'coins', NULL, 3000, 'rare', 10.00, 3000, 3),
  ('10000000-0000-0000-0000-000000000004', 'coins', NULL, 5000, 'epic', 10.00, 5000, 4),
  ('10000000-0000-0000-0000-000000000004', 'coins', NULL, 8000, 'epic', 10.00, 8000, 5),
  ('10000000-0000-0000-0000-000000000004', 'coins', NULL, 10000, 'legendary', 25.00, 10000, 6),
  ('10000000-0000-0000-0000-000000000004', 'coins', NULL, 15000, 'legendary', 15.00, 15000, 7),
  ('10000000-0000-0000-0000-000000000004', 'coins', NULL, 25000, 'premium', 9.50, 25000, 8),
  ('10000000-0000-0000-0000-000000000004', 'coins', NULL, 50000, 'premium', 0.50, 50000, 9)
ON CONFLICT DO NOTHING;

-- PREMIUM SUBSCRIPTION CASE ITEMS (10000 coins)
-- This is the ONLY case that can drop the special "#1 Badge" virtual item
INSERT INTO case_items (case_id, item_type, badge_id, coin_amount, rarity, drop_rate, display_value, display_order)
VALUES
  -- High value coins (30%)
  ('10000000-0000-0000-0000-000000000005', 'coins', NULL, 3000, 'rare', 10.00, 3000, 1),
  ('10000000-0000-0000-0000-000000000005', 'coins', NULL, 5000, 'rare', 10.00, 5000, 2),
  ('10000000-0000-0000-0000-000000000005', 'coins', NULL, 8000, 'epic', 10.00, 8000, 3),
  -- Super high value
  ('10000000-0000-0000-0000-000000000005', 'coins', NULL, 12000, 'epic', 20.00, 12000, 4),
  ('10000000-0000-0000-0000-000000000005', 'coins', NULL, 20000, 'legendary', 30.00, 20000, 5),
  ('10000000-0000-0000-0000-000000000005', 'coins', NULL, 30000, 'legendary', 15.00, 30000, 6),
  ('10000000-0000-0000-0000-000000000005', 'coins', NULL, 50000, 'premium', 12.00, 50000, 7),
  ('10000000-0000-0000-0000-000000000005', 'coins', NULL, 75000, 'premium', 2.99, 75000, 8),
  -- #1 BADGE - ULTRA RARE (0.01%) - stored as special coins value
  ('10000000-0000-0000-0000-000000000005', 'coins', NULL, 100000, 'premium', 0.01, 100000, 9)
ON CONFLICT DO NOTHING;