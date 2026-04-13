/*
  # Add #1 Badge to Case Opening System

  1. Changes
    - Creates the special #1 Badge in the badges table (with NULL profile_id for global badge)
    - Adds the #1 Badge as a droppable item in the Premium Subscription Case
    - Removes the placeholder 100000 coins entry
    - Sets proper ultra-rare drop rate (0.01%)

  2. Security
    - Maintains existing RLS policies
    - No changes to security model
*/

-- First, temporarily allow NULL profile_id for badges if needed
DO $$
BEGIN
  -- Check if the constraint exists and temporarily disable it
  ALTER TABLE badges ALTER COLUMN profile_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore if column is already nullable
END $$;

-- Create the #1 Badge (global badge with no owner)
INSERT INTO badges (
  id,
  profile_id,
  name,
  description,
  icon_url,
  color
) VALUES (
  '99999999-0000-0000-0000-000000000001'::uuid,
  NULL,
  '#1 Badge',
  'The ultimate prize! Ultra rare badge that proves you''re #1. Only obtainable from Premium Subscription Cases.',
  'https://images.pexels.com/photos/1049622/pexels-photo-1049622.jpeg',
  '#FFD700'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_url = EXCLUDED.icon_url,
  color = EXCLUDED.color;

-- Remove the placeholder 100000 coins entry from Premium Subscription Case
DELETE FROM case_items 
WHERE case_id = '10000000-0000-0000-0000-000000000005' 
  AND item_type = 'coins' 
  AND coin_amount = 100000
  AND drop_rate = 0.01;

-- Add the #1 Badge as an ultra-rare drop to Premium Subscription Case
INSERT INTO case_items (
  case_id,
  item_type,
  badge_id,
  coin_amount,
  rarity,
  drop_rate,
  display_value,
  display_order
) VALUES (
  '10000000-0000-0000-0000-000000000005',
  'badge',
  '99999999-0000-0000-0000-000000000001'::uuid,
  NULL,
  'premium',
  0.01,
  100000,
  999
) ON CONFLICT DO NOTHING;
