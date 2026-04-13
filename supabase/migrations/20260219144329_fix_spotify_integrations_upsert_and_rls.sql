/*
  # Fix Spotify Integrations - Upsert and RLS

  1. Problem
    - The table uses `id` as PK but upsert uses `onConflict: "user_id"`
    - user_id has no UNIQUE constraint, so upsert fails silently
    - service_role needs unrestricted access for Edge Functions

  2. Changes
    - Add UNIQUE constraint on user_id so upsert works correctly
    - Drop all existing RLS policies
    - Disable RLS entirely so service_role (Edge Functions) can always read/write
    - Add back only user-facing policies via service_role bypass

  3. Notes
    - service_role always bypasses RLS by default in Postgres/Supabase
    - But with RLS enabled and no matching policy, even service_role via supabase-js
      can get blocked if using the anon key accidentally
    - Safe solution: keep RLS enabled, ensure service_role bypass works
*/

-- Add UNIQUE constraint on user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'spotify_integrations'
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'spotify_integrations_user_id_key'
  ) THEN
    ALTER TABLE spotify_integrations ADD CONSTRAINT spotify_integrations_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own connection status" ON spotify_integrations;
DROP POLICY IF EXISTS "Users can update own show_on_profile" ON spotify_integrations;
DROP POLICY IF EXISTS "Users can delete own integration" ON spotify_integrations;
DROP POLICY IF EXISTS "Users can insert own integration" ON spotify_integrations;
DROP POLICY IF EXISTS "spotify_integrations_owner" ON spotify_integrations;
DROP POLICY IF EXISTS "spotify_integrations_owner_all" ON spotify_integrations;
DROP POLICY IF EXISTS "Users can read own Spotify integration" ON spotify_integrations;

-- Keep RLS enabled (service_role bypasses it automatically)
ALTER TABLE spotify_integrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own connection status
CREATE POLICY "Users can view own spotify connection"
  ON spotify_integrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update show_on_profile
CREATE POLICY "Users can update own spotify show_on_profile"
  ON spotify_integrations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own integration
CREATE POLICY "Users can delete own spotify integration"
  ON spotify_integrations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
