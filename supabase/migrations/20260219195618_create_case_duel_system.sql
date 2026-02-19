/*
  # Case 1v1 Duel System

  ## Overview
  Creates a real case-opening 1v1 duel system where users can challenge
  other users or bots to open a case simultaneously. The higher-value
  item wins the duel.

  ## New Tables

  ### case_duels
  - Tracks duel challenges between users (or user vs bot)
  - challenger_id: the user who created the duel
  - opponent_id: the challenged user (null if bot)
  - is_bot_opponent: true if playing against the house bot
  - case_id: which case both players open
  - status: pending / accepted / completed / declined / expired
  - challenger_item_data / opponent_item_data: the won items (JSON)
  - winner_id: user_id of winner (null if bot won or tie)
  - bot_won: true if the bot won
  - created_at, accepted_at, completed_at

  ## Security
  - RLS enabled, users can only see duels they are part of
  - Insert allowed for authenticated users
  - Update restricted to relevant parties
*/

CREATE TABLE IF NOT EXISTS case_duels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_bot_opponent boolean NOT NULL DEFAULT false,
  case_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','completed','declined','expired')),
  challenger_item_data jsonb,
  opponent_item_data jsonb,
  winner_id uuid REFERENCES auth.users(id),
  bot_won boolean NOT NULL DEFAULT false,
  coins_wagered integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE case_duels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own duels"
  ON case_duels FOR SELECT
  TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE POLICY "Authenticated users can create duels"
  ON case_duels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Participants can update duels"
  ON case_duels FOR UPDATE
  TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id)
  WITH CHECK (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE INDEX IF NOT EXISTS idx_case_duels_challenger ON case_duels(challenger_id);
CREATE INDEX IF NOT EXISTS idx_case_duels_opponent ON case_duels(opponent_id);
CREATE INDEX IF NOT EXISTS idx_case_duels_status ON case_duels(status);
