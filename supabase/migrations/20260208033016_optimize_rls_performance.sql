/*
  # Optimize RLS Performance and Fix Security Issues

  1. Performance Optimizations
    - Update RLS policies to use `(select auth.uid())` instead of `auth.uid()`
    - This prevents re-evaluation for each row and improves query performance at scale
    - Affects tables: profiles, spotify_integrations, discord_integrations

  2. Security Fixes
    - Remove duplicate permissive policies on discord_presence
    - Drop unused indexes that consume storage without benefit

  3. Changes
    - Profiles: Optimize create/update/delete policies
    - Spotify integrations: Optimize all policies
    - Discord integrations: Optimize all policies
    - Discord presence: Remove duplicate policies
    - Drop unused indexes
*/

-- ========================================
-- 1. OPTIMIZE PROFILES RLS POLICIES
-- ========================================

DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
TO authenticated
USING ((select auth.uid()) = id);

-- ========================================
-- 2. OPTIMIZE SPOTIFY INTEGRATIONS RLS POLICIES
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
    USING ((select auth.uid()) = user_id);

    CREATE POLICY "Users can create their spotify integration"
    ON public.spotify_integrations FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

    CREATE POLICY "Users can update their spotify integration"
    ON public.spotify_integrations FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

    CREATE POLICY "Users can delete their spotify integration"
    ON public.spotify_integrations FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- ========================================
-- 3. OPTIMIZE DISCORD INTEGRATIONS RLS POLICIES
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
    USING ((select auth.uid()) = user_id);

    CREATE POLICY "Users can create their discord integration"
    ON public.discord_integrations FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

    CREATE POLICY "Users can update their discord integration"
    ON public.discord_integrations FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

    CREATE POLICY "Users can delete their discord integration"
    ON public.discord_integrations FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- ========================================
-- 4. FIX DUPLICATE DISCORD PRESENCE POLICIES
-- ========================================

-- Drop the duplicate policy if it exists
DROP POLICY IF EXISTS "Discord presence is viewable by everyone" ON public.discord_presence;

-- Keep only the "Users can manage their discord presence" policy
-- This policy already covers SELECT, INSERT, UPDATE, DELETE for the owner

-- ========================================
-- 5. DROP UNUSED INDEXES
-- ========================================

-- These indexes are reported as unused by Supabase
-- They consume storage and maintenance overhead without benefit

DROP INDEX IF EXISTS public.idx_profiles_username;
DROP INDEX IF EXISTS public.idx_social_links_profile;
DROP INDEX IF EXISTS public.idx_badges_profile;
DROP INDEX IF EXISTS public.idx_profile_views_profile;
DROP INDEX IF EXISTS public.idx_profile_views_date;
