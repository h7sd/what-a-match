/*
  # Rollback RLS Optimization

  Reverts all changes from optimize_rls_performance migration:
  - Restore original auth.uid() patterns in RLS policies
  - Recreate dropped indexes
  - Restore duplicate discord_presence policy
*/

-- ========================================
-- 1. RESTORE PROFILES RLS POLICIES
-- ========================================

DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- ========================================
-- 2. RESTORE SPOTIFY INTEGRATIONS RLS POLICIES
-- ========================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'spotify_integrations') THEN
    DROP POLICY IF EXISTS "Users can view their own spotify integration" ON public.spotify_integrations;
    DROP POLICY IF EXISTS "Users can create their spotify integration" ON public.spotify_integrations;
    DROP POLICY IF EXISTS "Users can update their spotify integration" ON public.spotify_integrations;
    DROP POLICY IF EXISTS "Users can delete their spotify integration" ON public.spotify_integrations;

    CREATE POLICY "Users can view their own spotify integration"
    ON public.spotify_integrations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their spotify integration"
    ON public.spotify_integrations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their spotify integration"
    ON public.spotify_integrations FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete their spotify integration"
    ON public.spotify_integrations FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- ========================================
-- 3. RESTORE DISCORD INTEGRATIONS RLS POLICIES
-- ========================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'discord_integrations') THEN
    DROP POLICY IF EXISTS "Users can view their own discord integration" ON public.discord_integrations;
    DROP POLICY IF EXISTS "Users can create their discord integration" ON public.discord_integrations;
    DROP POLICY IF EXISTS "Users can update their discord integration" ON public.discord_integrations;
    DROP POLICY IF EXISTS "Users can delete their discord integration" ON public.discord_integrations;

    CREATE POLICY "Users can view their own discord integration"
    ON public.discord_integrations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their discord integration"
    ON public.discord_integrations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their discord integration"
    ON public.discord_integrations FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete their discord integration"
    ON public.discord_integrations FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- ========================================
-- 4. RESTORE DISCORD PRESENCE DUPLICATE POLICY
-- ========================================

CREATE POLICY "Discord presence is viewable by everyone"
ON public.discord_presence FOR SELECT
USING (true);

-- ========================================
-- 5. RECREATE INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_social_links_profile ON public.social_links(profile_id);
CREATE INDEX IF NOT EXISTS idx_badges_profile ON public.badges(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON public.profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_date ON public.profile_views(viewed_at);
