/*
  # Add global_badge_id to case_items

  ## Changes
  - Add `global_badge_id` column to case_items that references global_badges
  - Add visual columns (gradient_css, accent_color) to cases table
  - Re-seed case items with proper global badge rewards + premium_key type
*/

-- Add visual styling columns to cases
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'gradient_css') THEN
    ALTER TABLE cases ADD COLUMN gradient_css text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'accent_color') THEN
    ALTER TABLE cases ADD COLUMN accent_color text DEFAULT '#f59e0b';
  END IF;
END $$;

-- Add global_badge_id to case_items (FK to global_badges)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'case_items' AND column_name = 'global_badge_id') THEN
    ALTER TABLE case_items ADD COLUMN global_badge_id uuid REFERENCES global_badges(id);
  END IF;
END $$;

-- Update cases with visual data
UPDATE cases SET
  name = 'Starter Case',
  description = 'Your first step into the vault. Contains coins and common badges.',
  gradient_css = 'linear-gradient(135deg, #0d1b3e 0%, #1a3a6e 100%)',
  accent_color = '#60a5fa',
  price = 100
WHERE id = '7b768dfe-2bc3-48bd-97ee-4ef98d592d72';

UPDATE cases SET
  name = 'Standard Case',
  description = 'A balanced mix of coins and rare badges for experienced collectors.',
  gradient_css = 'linear-gradient(135deg, #1a0533 0%, #3b1f7a 100%)',
  accent_color = '#a78bfa',
  price = 500
WHERE id = '8ea65e47-4014-4d0a-ba92-75b219581e08';

UPDATE cases SET
  name = 'Legendary Case',
  description = 'High-tier rewards with epic and legendary badges plus massive coins.',
  gradient_css = 'linear-gradient(135deg, #2d0f00 0%, #7c2d12 100%)',
  accent_color = '#f97316',
  price = 2000
WHERE id = 'b756b111-e083-4c32-b640-9c4a44f1afb8';

UPDATE cases SET
  name = 'Ultimate Case',
  description = 'The rarest case. Contains the legendary Premium Key — 1 in 50,000 chance.',
  gradient_css = 'linear-gradient(135deg, #0d1f12 0%, #14532d 100%)',
  accent_color = '#ffd700',
  price = 10000
WHERE id = '86dd447c-954c-47e8-93f9-56657ac0a795';

-- Clear all existing case items
DELETE FROM case_items WHERE case_id IN (
  '7b768dfe-2bc3-48bd-97ee-4ef98d592d72',
  '8ea65e47-4014-4d0a-ba92-75b219581e08',
  'b756b111-e083-4c32-b640-9c4a44f1afb8',
  '86dd447c-954c-47e8-93f9-56657ac0a795'
);

-- ============================================================
-- STARTER CASE (100 coins) - total = 100%
-- ============================================================
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, coin_amount, display_value) VALUES
  ('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'coins', 'common',    35.0, 5,   5),
  ('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'coins', 'common',    22.0, 10,  10),
  ('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'coins', 'common',    12.0, 25,  25),
  ('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'coins', 'rare',       6.0, 50,  50),
  ('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'coins', 'rare',       3.0, 100, 100),
  ('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'coins', 'epic',       1.0, 250, 250);

INSERT INTO case_items (case_id, item_type, global_badge_id, rarity, drop_rate, display_value) VALUES
  ('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'badge', '4b3da31f-2d77-465e-b0d1-9f1c2ab9a5e6', 'common',    10.0, 50),
  ('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'badge', 'bea24cf9-0dfa-4bb3-9e2a-07a33b9c7e20', 'common',     5.0, 100),
  ('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'badge', '60d08ff5-dc8d-4728-bffd-1373473c3ad8', 'rare',        3.0, 200),
  ('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'badge', '4a3a59ff-2945-4824-b848-ed43d92a1d8a', 'rare',        2.0, 300),
  ('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'badge', '339598b1-ce3a-405e-8b5c-48f5ccaaa48e', 'epic',        0.998, 500);

INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value) VALUES
  ('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'premium_key', 'premium', 0.002, 99999);

-- ============================================================
-- STANDARD CASE (500 coins) - total = 100%
-- ============================================================
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, coin_amount, display_value) VALUES
  ('8ea65e47-4014-4d0a-ba92-75b219581e08', 'coins', 'common',    28.0, 50,   50),
  ('8ea65e47-4014-4d0a-ba92-75b219581e08', 'coins', 'common',    18.0, 100,  100),
  ('8ea65e47-4014-4d0a-ba92-75b219581e08', 'coins', 'rare',      10.0, 250,  250),
  ('8ea65e47-4014-4d0a-ba92-75b219581e08', 'coins', 'rare',       7.0, 500,  500),
  ('8ea65e47-4014-4d0a-ba92-75b219581e08', 'coins', 'epic',       4.0, 1000, 1000),
  ('8ea65e47-4014-4d0a-ba92-75b219581e08', 'coins', 'legendary',  1.5, 2500, 2500);

INSERT INTO case_items (case_id, item_type, global_badge_id, rarity, drop_rate, display_value) VALUES
  ('8ea65e47-4014-4d0a-ba92-75b219581e08', 'badge', '4b3da31f-2d77-465e-b0d1-9f1c2ab9a5e6', 'common',    12.0, 100),
  ('8ea65e47-4014-4d0a-ba92-75b219581e08', 'badge', 'ac596906-b9ff-4f11-8e97-c4b06e966329', 'rare',        7.0, 300),
  ('8ea65e47-4014-4d0a-ba92-75b219581e08', 'badge', '60d08ff5-dc8d-4728-bffd-1373473c3ad8', 'rare',        5.0, 400),
  ('8ea65e47-4014-4d0a-ba92-75b219581e08', 'badge', '4a3a59ff-2945-4824-b848-ed43d92a1d8a', 'epic',        3.0, 750),
  ('8ea65e47-4014-4d0a-ba92-75b219581e08', 'badge', 'a2372b53-825f-49c9-b386-c4a4e02bd97d', 'epic',        2.0, 1000),
  ('8ea65e47-4014-4d0a-ba92-75b219581e08', 'badge', '07fa6ac6-8682-44d9-b7ec-1a07fb957f66', 'legendary',   0.998, 2000),
  ('8ea65e47-4014-4d0a-ba92-75b219581e08', 'badge', '22e7ebcc-8a9f-4f8e-91c6-48c7babc0039', 'legendary',   1.0, 2500);

INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value) VALUES
  ('8ea65e47-4014-4d0a-ba92-75b219581e08', 'premium_key', 'premium', 0.002, 99999);

-- ============================================================
-- LEGENDARY CASE (2000 coins) - total = 100%
-- ============================================================
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, coin_amount, display_value) VALUES
  ('b756b111-e083-4c32-b640-9c4a44f1afb8', 'coins', 'common',    20.0, 200,   200),
  ('b756b111-e083-4c32-b640-9c4a44f1afb8', 'coins', 'common',    15.0, 500,   500),
  ('b756b111-e083-4c32-b640-9c4a44f1afb8', 'coins', 'rare',      10.0, 1000,  1000),
  ('b756b111-e083-4c32-b640-9c4a44f1afb8', 'coins', 'rare',       7.0, 2000,  2000),
  ('b756b111-e083-4c32-b640-9c4a44f1afb8', 'coins', 'epic',       4.0, 5000,  5000),
  ('b756b111-e083-4c32-b640-9c4a44f1afb8', 'coins', 'legendary',  2.0, 10000, 10000);

INSERT INTO case_items (case_id, item_type, global_badge_id, rarity, drop_rate, display_value) VALUES
  ('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', '4b3da31f-2d77-465e-b0d1-9f1c2ab9a5e6', 'common',    10.0, 200),
  ('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', 'ac596906-b9ff-4f11-8e97-c4b06e966329', 'rare',        8.0, 500),
  ('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', '5147f617-8b2e-4091-9091-82f325265b21', 'rare',        6.0, 800),
  ('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', 'a2372b53-825f-49c9-b386-c4a4e02bd97d', 'epic',        5.0, 2000),
  ('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', '07fa6ac6-8682-44d9-b7ec-1a07fb957f66', 'legendary',   3.0, 5000),
  ('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', '22e7ebcc-8a9f-4f8e-91c6-48c7babc0039', 'legendary',   2.998, 5000),
  ('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', 'a7114921-ebee-48d0-bd57-2e0deabd3631', 'legendary',   5.0, 3000),
  ('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', '68f302c3-8b73-4791-9551-9b8435a8fd93', 'epic',        2.0, 2500);

INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value) VALUES
  ('b756b111-e083-4c32-b640-9c4a44f1afb8', 'premium_key', 'premium', 0.002, 99999);

-- ============================================================
-- ULTIMATE CASE (10000 coins) - total = 100%
-- ============================================================
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, coin_amount, display_value) VALUES
  ('86dd447c-954c-47e8-93f9-56657ac0a795', 'coins', 'common',    18.0, 1000,   1000),
  ('86dd447c-954c-47e8-93f9-56657ac0a795', 'coins', 'common',    14.0, 5000,   5000),
  ('86dd447c-954c-47e8-93f9-56657ac0a795', 'coins', 'rare',       9.0, 10000,  10000),
  ('86dd447c-954c-47e8-93f9-56657ac0a795', 'coins', 'rare',       7.0, 20000,  20000),
  ('86dd447c-954c-47e8-93f9-56657ac0a795', 'coins', 'epic',       4.0, 50000,  50000),
  ('86dd447c-954c-47e8-93f9-56657ac0a795', 'coins', 'legendary',  2.0, 100000, 100000);

INSERT INTO case_items (case_id, item_type, global_badge_id, rarity, drop_rate, display_value) VALUES
  ('86dd447c-954c-47e8-93f9-56657ac0a795', 'badge', 'a2372b53-825f-49c9-b386-c4a4e02bd97d', 'rare',        12.0, 5000),
  ('86dd447c-954c-47e8-93f9-56657ac0a795', 'badge', '07fa6ac6-8682-44d9-b7ec-1a07fb957f66', 'rare',         9.0, 7500),
  ('86dd447c-954c-47e8-93f9-56657ac0a795', 'badge', '22e7ebcc-8a9f-4f8e-91c6-48c7babc0039', 'epic',         6.0, 15000),
  ('86dd447c-954c-47e8-93f9-56657ac0a795', 'badge', 'a7114921-ebee-48d0-bd57-2e0deabd3631', 'epic',         5.0, 15000),
  ('86dd447c-954c-47e8-93f9-56657ac0a795', 'badge', '68f302c3-8b73-4791-9551-9b8435a8fd93', 'legendary',    4.0, 25000),
  ('86dd447c-954c-47e8-93f9-56657ac0a795', 'badge', 'b7fa6824-c8b8-45b2-afe2-8c4da5ef9f2e', 'legendary',    3.0, 30000),
  ('86dd447c-954c-47e8-93f9-56657ac0a795', 'badge', 'bea24cf9-0dfa-4bb3-9e2a-07a33b9c7e20', 'legendary',    4.996, 20000);

INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value) VALUES
  ('86dd447c-954c-47e8-93f9-56657ac0a795', 'premium_key', 'premium', 0.004, 99999);
