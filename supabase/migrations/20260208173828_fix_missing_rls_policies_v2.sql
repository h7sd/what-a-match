/*
  # Fix Missing RLS Policies

  This migration adds missing SELECT policies for tables that have RLS enabled but no read access policies.

  1. Changes
    - Add public read policies for tables that need to be readable
    - Add owner-based read policies for user-specific data
    - Add admin policies where appropriate

  2. Security
    - Ensures proper access control while allowing necessary data access
    - Maintains RLS protection on all tables
*/

-- social_links: Public can read visible links
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'social_links' AND policyname = 'social_links_public_read'
  ) THEN
    CREATE POLICY "social_links_public_read"
      ON social_links FOR SELECT
      TO public
      USING (is_visible = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'social_links' AND policyname = 'social_links_owner_all'
  ) THEN
    CREATE POLICY "social_links_owner_all"
      ON social_links FOR ALL
      TO authenticated
      USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
      WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
  END IF;
END $$;

-- profile_comments: Owner can read their comments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profile_comments' AND policyname = 'profile_comments_owner_read'
  ) THEN
    CREATE POLICY "profile_comments_owner_read"
      ON profile_comments FOR SELECT
      TO authenticated
      USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profile_comments' AND policyname = 'profile_comments_public_insert'
  ) THEN
    CREATE POLICY "profile_comments_public_insert"
      ON profile_comments FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

-- profile_likes: Owner can read their likes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profile_likes' AND policyname = 'profile_likes_owner_read'
  ) THEN
    CREATE POLICY "profile_likes_owner_read"
      ON profile_likes FOR SELECT
      TO authenticated
      USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profile_likes' AND policyname = 'profile_likes_public_insert'
  ) THEN
    CREATE POLICY "profile_likes_public_insert"
      ON profile_likes FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

-- user_notifications: Owner can read their notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_notifications' AND policyname = 'user_notifications_owner_read'
  ) THEN
    CREATE POLICY "user_notifications_owner_read"
      ON user_notifications FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_notifications' AND policyname = 'user_notifications_owner_update'
  ) THEN
    CREATE POLICY "user_notifications_owner_update"
      ON user_notifications FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- user_streaks: Owner can read their streaks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_streaks' AND policyname = 'user_streaks_owner_all'
  ) THEN
    CREATE POLICY "user_streaks_owner_all"
      ON user_streaks FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- user_inventory: Owner can read their inventory
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_inventory' AND policyname = 'user_inventory_owner_read'
  ) THEN
    CREATE POLICY "user_inventory_owner_read"
      ON user_inventory FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- discord_integrations: Owner can read their integration
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'discord_integrations' AND policyname = 'discord_integrations_owner_all'
  ) THEN
    CREATE POLICY "discord_integrations_owner_all"
      ON discord_integrations FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- discord_bot_verification: Owner can read their verification
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'discord_bot_verification' AND policyname = 'discord_bot_verification_owner_all'
  ) THEN
    CREATE POLICY "discord_bot_verification_owner_all"
      ON discord_bot_verification FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- daily_rewards: Owner can read their rewards
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_rewards' AND policyname = 'daily_rewards_owner_read'
  ) THEN
    CREATE POLICY "daily_rewards_owner_read"
      ON daily_rewards FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- spotify_integrations: Owner can read their integration
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'spotify_integrations' AND policyname = 'spotify_integrations_owner_all'
  ) THEN
    CREATE POLICY "spotify_integrations_owner_all"
      ON spotify_integrations FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- alias_requests: Owner or target can read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'alias_requests' AND policyname = 'alias_requests_involved_read'
  ) THEN
    CREATE POLICY "alias_requests_involved_read"
      ON alias_requests FOR SELECT
      TO authenticated
      USING (requester_id = auth.uid() OR target_user_id = auth.uid());
  END IF;
END $$;

-- promo_code_uses: Owner can read their uses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'promo_code_uses' AND policyname = 'promo_code_uses_owner_read'
  ) THEN
    CREATE POLICY "promo_code_uses_owner_read"
      ON promo_code_uses FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- support_messages: Ticket owner can read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'support_messages' AND policyname = 'support_messages_ticket_owner_read'
  ) THEN
    CREATE POLICY "support_messages_ticket_owner_read"
      ON support_messages FOR SELECT
      TO authenticated
      USING (
        ticket_id IN (
          SELECT id FROM support_tickets WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- live_chat_conversations: Owner or admin can read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'live_chat_conversations' AND policyname = 'live_chat_conversations_owner_read'
  ) THEN
    CREATE POLICY "live_chat_conversations_owner_read"
      ON live_chat_conversations FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- live_chat_messages: Conversation participant can read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'live_chat_messages' AND policyname = 'live_chat_messages_participant_read'
  ) THEN
    CREATE POLICY "live_chat_messages_participant_read"
      ON live_chat_messages FOR SELECT
      TO authenticated
      USING (
        conversation_id IN (
          SELECT id FROM live_chat_conversations WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- admin_discord_roles: Admin only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_discord_roles' AND policyname = 'admin_discord_roles_admin_all'
  ) THEN
    CREATE POLICY "admin_discord_roles_admin_all"
      ON admin_discord_roles FOR ALL
      TO authenticated
      USING (has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- admin_webhooks: Admin only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_webhooks' AND policyname = 'admin_webhooks_admin_all'
  ) THEN
    CREATE POLICY "admin_webhooks_admin_all"
      ON admin_webhooks FOR ALL
      TO authenticated
      USING (has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- bot_command_notifications: Admin only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bot_command_notifications' AND policyname = 'bot_command_notifications_admin_read'
  ) THEN
    CREATE POLICY "bot_command_notifications_admin_read"
      ON bot_command_notifications FOR SELECT
      TO authenticated
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;
