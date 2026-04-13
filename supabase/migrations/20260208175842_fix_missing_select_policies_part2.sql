/*
  # Fix missing SELECT policies for critical tables

  Adds SELECT policies for tables that are accessed by the frontend:
  - user_streaks (users can read own streak data)
  - discord_integrations (users can read own Discord data)
  - discord_bot_verification (users can read own verification codes)
  - spotify_integrations (users can read own Spotify data)
  
  Admin-only and sensitive tables are kept restricted.
*/

-- user_streaks: Users can read their own streak data
CREATE POLICY "Users can read own streak data"
  ON public.user_streaks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- discord_integrations: Users can read their own Discord integration
CREATE POLICY "Users can read own Discord integration"
  ON public.discord_integrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- discord_bot_verification: Users can read their own verification codes
CREATE POLICY "Users can read own verification codes"
  ON public.discord_bot_verification
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- spotify_integrations: Users can read their own Spotify integration
CREATE POLICY "Users can read own Spotify integration"
  ON public.spotify_integrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Note: verification_codes, admin_discord_roles, and admin_webhooks
-- are intentionally left without SELECT policies as they should only
-- be accessed via service role or Edge Functions