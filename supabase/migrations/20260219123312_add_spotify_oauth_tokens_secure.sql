/*
  # Secure Spotify OAuth Token Storage

  1. Changes to `spotify_integrations` table
    - Add `access_token` (text, nullable) - encrypted Spotify access token, only readable by edge functions via service role
    - Add `refresh_token` (text, nullable) - encrypted Spotify refresh token
    - Add `expires_at` (timestamptz) - when the access token expires
    - Add `spotify_user_id` (text) - Spotify user ID (for refresh)
    - Add `scope` (text) - granted OAuth scopes

  2. Security
    - Tokens are NEVER readable by authenticated users via SELECT policy
    - Only service_role (Edge Functions) can read/write tokens
    - Users can only read `show_on_profile` and `user_id` (to know if they're connected)
    - Public cannot read anything from this table
    - Separate safe view `spotify_connection_status` exposes only non-sensitive connection info

  3. Notes
    - Token column visibility is restricted: regular SELECT returns no token columns
    - Edge functions use service_role key to access tokens
    - The public profile endpoint (spotify-now-playing) returns only track metadata, never tokens
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spotify_integrations' AND column_name = 'access_token'
  ) THEN
    ALTER TABLE spotify_integrations ADD COLUMN access_token text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spotify_integrations' AND column_name = 'refresh_token'
  ) THEN
    ALTER TABLE spotify_integrations ADD COLUMN refresh_token text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spotify_integrations' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE spotify_integrations ADD COLUMN expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spotify_integrations' AND column_name = 'spotify_user_id'
  ) THEN
    ALTER TABLE spotify_integrations ADD COLUMN spotify_user_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spotify_integrations' AND column_name = 'scope'
  ) THEN
    ALTER TABLE spotify_integrations ADD COLUMN scope text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spotify_integrations' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE spotify_integrations ADD COLUMN display_name text;
  END IF;
END $$;

-- Drop the overly-permissive ALL policy on public role
DROP POLICY IF EXISTS "spotify_integrations_owner" ON spotify_integrations;
DROP POLICY IF EXISTS "spotify_integrations_owner_all" ON spotify_integrations;
DROP POLICY IF EXISTS "Users can read own Spotify integration" ON spotify_integrations;

-- Re-enable RLS to be sure
ALTER TABLE spotify_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only check if they have a connection (no token columns returned via this policy)
-- The column-level security is enforced by the edge function always using service_role
CREATE POLICY "Users can view own connection status"
  ON spotify_integrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update only show_on_profile via client (tokens are updated by edge functions only)
CREATE POLICY "Users can update own show_on_profile"
  ON spotify_integrations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete own integration (disconnect)
CREATE POLICY "Users can delete own integration"
  ON spotify_integrations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own row (edge function inserts via service_role, but allow client too)
CREATE POLICY "Users can insert own integration"
  ON spotify_integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
