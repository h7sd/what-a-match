/*
  # Add Remaining RLS Policies

  This migration adds RLS policies for remaining tables that need access control.

  1. Changes
    - Add policies for profile_views, link_clicks, discord_presence
    - Add policies for transaction and battle tables
    - Add policies for marketplace and case-related tables

  2. Security
    - Ensures proper access control for all tables
    - Maintains data privacy and security
*/

-- profile_views: Owner can read their views
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profile_views' AND policyname = 'profile_views_owner_read'
  ) THEN
    CREATE POLICY "profile_views_owner_read"
      ON profile_views FOR SELECT
      TO authenticated
      USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profile_views' AND policyname = 'profile_views_public_insert'
  ) THEN
    CREATE POLICY "profile_views_public_insert"
      ON profile_views FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

-- link_clicks: Owner can read their clicks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'link_clicks' AND policyname = 'link_clicks_owner_read'
  ) THEN
    CREATE POLICY "link_clicks_owner_read"
      ON link_clicks FOR SELECT
      TO authenticated
      USING (
        link_id IN (
          SELECT id FROM social_links 
          WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'link_clicks' AND policyname = 'link_clicks_public_insert'
  ) THEN
    CREATE POLICY "link_clicks_public_insert"
      ON link_clicks FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

-- discord_presence: Public can read presence
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'discord_presence' AND policyname = 'discord_presence_public_read'
  ) THEN
    CREATE POLICY "discord_presence_public_read"
      ON discord_presence FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'discord_presence' AND policyname = 'discord_presence_owner_all'
  ) THEN
    CREATE POLICY "discord_presence_owner_all"
      ON discord_presence FOR ALL
      TO authenticated
      USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
      WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
  END IF;
END $$;

-- banned_users: Owner can read their ban status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'banned_users' AND policyname = 'banned_users_owner_read'
  ) THEN
    CREATE POLICY "banned_users_owner_read"
      ON banned_users FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'banned_users' AND policyname = 'banned_users_admin_all'
  ) THEN
    CREATE POLICY "banned_users_admin_all"
      ON banned_users FOR ALL
      TO authenticated
      USING (has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- case_transactions: Owner can read their transactions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'case_transactions' AND policyname = 'case_transactions_owner_read'
  ) THEN
    CREATE POLICY "case_transactions_owner_read"
      ON case_transactions FOR SELECT
      TO authenticated
      USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
  END IF;
END $$;

-- case_battles: Public can read battles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'case_battles' AND policyname = 'case_battles_public_read'
  ) THEN
    CREATE POLICY "case_battles_public_read"
      ON case_battles FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- battle_participants: Public can read participants
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'battle_participants' AND policyname = 'battle_participants_public_read'
  ) THEN
    CREATE POLICY "battle_participants_public_read"
      ON battle_participants FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- marketplace_purchases: Owner can read their purchases
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_purchases' AND policyname = 'marketplace_purchases_owner_read'
  ) THEN
    CREATE POLICY "marketplace_purchases_owner_read"
      ON marketplace_purchases FOR SELECT
      TO authenticated
      USING (buyer_id = auth.uid() OR seller_id = auth.uid());
  END IF;
END $$;

-- minigame_stats: Owner can read their stats
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'minigame_stats' AND policyname = 'minigame_stats_owner_read'
  ) THEN
    CREATE POLICY "minigame_stats_owner_read"
      ON minigame_stats FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- uv_transactions: Owner can read their transactions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'uv_transactions' AND policyname = 'uv_transactions_owner_read'
  ) THEN
    CREATE POLICY "uv_transactions_owner_read"
      ON uv_transactions FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- live_feed: Public can read feed
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'live_feed' AND policyname = 'live_feed_public_read'
  ) THEN
    CREATE POLICY "live_feed_public_read"
      ON live_feed FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- case_opening_history: Owner can read their history
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'case_opening_history' AND policyname = 'case_opening_history_owner_read'
  ) THEN
    CREATE POLICY "case_opening_history_owner_read"
      ON case_opening_history FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- badge_steals: Public can read steals
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'badge_steals' AND policyname = 'badge_steals_public_read'
  ) THEN
    CREATE POLICY "badge_steals_public_read"
      ON badge_steals FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- bot_commands: Public can read commands
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bot_commands' AND policyname = 'bot_commands_public_read'
  ) THEN
    CREATE POLICY "bot_commands_public_read"
      ON bot_commands FOR SELECT
      TO public
      USING (is_enabled = true);
  END IF;
END $$;

-- friend_badges: Owner or recipient can read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'friend_badges' AND policyname = 'friend_badges_involved_read'
  ) THEN
    CREATE POLICY "friend_badges_involved_read"
      ON friend_badges FOR SELECT
      TO authenticated
      USING (creator_id = auth.uid() OR recipient_id = auth.uid());
  END IF;
END $$;

-- user_roles: Public can read roles (needed for has_role function)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'user_roles_public_read'
  ) THEN
    CREATE POLICY "user_roles_public_read"
      ON user_roles FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;
