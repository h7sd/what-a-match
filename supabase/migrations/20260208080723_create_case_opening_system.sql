/*
  # Case Opening Gambling System

  ## New Tables
  
  1. `cases`
    - `id` (uuid, primary key)
    - `name` (text) - Case name
    - `description` (text) - Case description
    - `image_url` (text) - Case image
    - `price` (bigint) - Cost in coins
    - `active` (boolean) - Whether case is available
    - `created_at` (timestamptz)
    - `order_index` (integer) - Display order

  2. `case_items`
    - `id` (uuid, primary key)
    - `case_id` (uuid, foreign key to cases)
    - `item_type` (text) - 'badge' or 'coins'
    - `badge_id` (uuid, foreign key to badges) - NULL if coins
    - `coin_amount` (bigint) - NULL if badge
    - `rarity` (text) - common, rare, epic, legendary, premium
    - `drop_rate` (numeric) - Percentage chance (0-100)
    - `display_value` (bigint) - Estimated coin value for display
    - `created_at` (timestamptz)

  3. `user_inventory`
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to profiles)
    - `item_type` (text) - 'badge' or 'coins'
    - `badge_id` (uuid, foreign key to badges) - NULL if coins
    - `coin_amount` (bigint) - NULL if badge
    - `rarity` (text)
    - `estimated_value` (bigint) - Coin value
    - `won_from_case_id` (uuid, foreign key to cases)
    - `won_at` (timestamptz)
    - `sold` (boolean) - Whether item has been sold
    - `sold_at` (timestamptz) - When item was sold

  4. `case_transactions`
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to profiles)
    - `case_id` (uuid, foreign key to cases)
    - `transaction_type` (text) - 'open', 'battle'
    - `items_won` (jsonb) - Array of items won
    - `total_value` (bigint) - Total value of items
    - `battle_id` (uuid) - NULL if solo open
    - `created_at` (timestamptz)

  5. `case_battles`
    - `id` (uuid, primary key)
    - `battle_type` (text) - '2v2' or '4v4'
    - `case_id` (uuid, foreign key to cases)
    - `entry_fee` (bigint) - Coins required to join
    - `status` (text) - 'waiting', 'in_progress', 'completed', 'cancelled'
    - `winner_team` (integer) - 1 or 2
    - `team1_total` (bigint) - Total value won by team 1
    - `team2_total` (bigint) - Total value won by team 2
    - `created_at` (timestamptz)
    - `started_at` (timestamptz)
    - `completed_at` (timestamptz)

  6. `battle_participants`
    - `id` (uuid, primary key)
    - `battle_id` (uuid, foreign key to case_battles)
    - `user_id` (uuid, foreign key to profiles)
    - `team` (integer) - 1 or 2
    - `items_won` (jsonb) - Items won during battle
    - `total_value` (bigint) - Value of items won
    - `joined_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can view their own inventory and transactions
  - Users can view active battles
  - Case opening and selling requires authentication
*/

-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  price bigint NOT NULL CHECK (price >= 0),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  order_index integer DEFAULT 0
);

-- Create case_items table
CREATE TABLE IF NOT EXISTS case_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('badge', 'coins')),
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  coin_amount bigint CHECK (coin_amount >= 0),
  rarity text NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'premium')),
  drop_rate numeric NOT NULL CHECK (drop_rate >= 0 AND drop_rate <= 100),
  display_value bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (item_type = 'badge' AND badge_id IS NOT NULL AND coin_amount IS NULL) OR
    (item_type = 'coins' AND badge_id IS NULL AND coin_amount IS NOT NULL)
  )
);

-- Create user_inventory table
CREATE TABLE IF NOT EXISTS user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('badge', 'coins')),
  badge_id uuid REFERENCES badges(id) ON DELETE SET NULL,
  coin_amount bigint CHECK (coin_amount >= 0),
  rarity text NOT NULL,
  estimated_value bigint NOT NULL DEFAULT 0,
  won_from_case_id uuid REFERENCES cases(id) ON DELETE SET NULL,
  won_at timestamptz DEFAULT now(),
  sold boolean DEFAULT false,
  sold_at timestamptz,
  CHECK (
    (item_type = 'badge' AND badge_id IS NOT NULL AND coin_amount IS NULL) OR
    (item_type = 'coins' AND badge_id IS NULL AND coin_amount IS NOT NULL)
  )
);

-- Create case_transactions table
CREATE TABLE IF NOT EXISTS case_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('open', 'battle')),
  items_won jsonb DEFAULT '[]'::jsonb,
  total_value bigint NOT NULL DEFAULT 0,
  battle_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Create case_battles table
CREATE TABLE IF NOT EXISTS case_battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_type text NOT NULL CHECK (battle_type IN ('2v2', '4v4')),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  entry_fee bigint NOT NULL CHECK (entry_fee >= 0),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  winner_team integer CHECK (winner_team IN (1, 2)),
  team1_total bigint DEFAULT 0,
  team2_total bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Create battle_participants table
CREATE TABLE IF NOT EXISTS battle_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES case_battles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team integer NOT NULL CHECK (team IN (1, 2)),
  items_won jsonb DEFAULT '[]'::jsonb,
  total_value bigint DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(battle_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_case_items_case_id ON case_items(case_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_sold ON user_inventory(sold) WHERE NOT sold;
CREATE INDEX IF NOT EXISTS idx_case_transactions_user_id ON case_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_case_battles_status ON case_battles(status);
CREATE INDEX IF NOT EXISTS idx_battle_participants_battle_id ON battle_participants(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_participants_user_id ON battle_participants(user_id);

-- Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Cases: Everyone can view active cases
CREATE POLICY "Anyone can view active cases"
  ON cases FOR SELECT
  TO authenticated
  USING (active = true);

-- Case items: Everyone can view items for active cases
CREATE POLICY "Anyone can view case items"
  ON case_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_items.case_id
      AND cases.active = true
    )
  );

-- User inventory: Users can view their own unsold items
CREATE POLICY "Users can view own inventory"
  ON user_inventory FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Case transactions: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON case_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Case battles: Everyone can view battles
CREATE POLICY "Anyone can view battles"
  ON case_battles FOR SELECT
  TO authenticated
  USING (true);

-- Battle participants: Everyone can view participants
CREATE POLICY "Anyone can view battle participants"
  ON battle_participants FOR SELECT
  TO authenticated
  USING (true);
