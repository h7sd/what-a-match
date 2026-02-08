-- Add features for CS2-style case opening system
-- Extends existing tables and adds live feed functionality

-- Add case opening history table if not exists
CREATE TABLE IF NOT EXISTS case_opening_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  case_id UUID REFERENCES cases(id),
  item_won_id UUID,
  coins_spent INTEGER NOT NULL,
  opened_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add live feed table for recent openings
CREATE TABLE IF NOT EXISTS live_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  case_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_rarity TEXT NOT NULL,
  item_value INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add is_premium column to cases if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE cases ADD COLUMN is_premium BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add display_order to case_items if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'case_items' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE case_items ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add sell_value to user_inventory if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_inventory' AND column_name = 'sell_value'
  ) THEN
    ALTER TABLE user_inventory ADD COLUMN sell_value INTEGER;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_feed_created ON live_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_user_opened ON case_opening_history(user_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_user_sold ON user_inventory(user_id, sold);

-- Enable RLS on new tables
ALTER TABLE case_opening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_feed ENABLE ROW LEVEL SECURITY;

-- RLS Policies for case_opening_history
DROP POLICY IF EXISTS "Users can view own history" ON case_opening_history;
CREATE POLICY "Users can view own history"
  ON case_opening_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert history" ON case_opening_history;
CREATE POLICY "Service role can insert history"
  ON case_opening_history FOR INSERT
  TO service_role
  WITH CHECK (true);

-- RLS Policies for live_feed
DROP POLICY IF EXISTS "Anyone can view live feed" ON live_feed;
CREATE POLICY "Anyone can view live feed"
  ON live_feed FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can insert live feed" ON live_feed;
CREATE POLICY "Service role can insert live feed"
  ON live_feed FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can delete old feed" ON live_feed;
CREATE POLICY "Service role can delete old feed"
  ON live_feed FOR DELETE
  TO service_role
  USING (true);

-- Function to clean old live feed entries (keep last 100)
CREATE OR REPLACE FUNCTION cleanup_live_feed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM live_feed
  WHERE id NOT IN (
    SELECT id FROM live_feed
    ORDER BY created_at DESC
    LIMIT 100
  );
END;
$$;