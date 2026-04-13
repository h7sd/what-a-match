/*
  # Fix Link Click Tracking and Profile Views

  1. Changes
    - Set default value of click_count on social_links to 0 (was NULL)
    - Create increment_link_click_count RPC function (was missing, causing click tracking to silently fail)
    - Add index on link_clicks for faster dedup lookups
    - Ensure profile_views has proper index for fast lookups

  2. Security
    - increment_link_click_count runs as security definer so the edge function (service role) can call it
    - Only allows incrementing by link_id, no other data modification
*/

-- Fix click_count default to 0
ALTER TABLE social_links ALTER COLUMN click_count SET DEFAULT 0;

-- Backfill NULLs to 0
UPDATE social_links SET click_count = 0 WHERE click_count IS NULL;

-- Create the missing RPC function for atomic click count increment
CREATE OR REPLACE FUNCTION increment_link_click_count(p_link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE social_links
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = p_link_id;
END;
$$;

-- Index for fast dedup check on link_clicks
CREATE INDEX IF NOT EXISTS idx_link_clicks_link_id_ip_hash_time
  ON link_clicks (link_id, viewer_ip_hash, clicked_at DESC);

-- Index for fast profile_views dedup check
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_ip_time
  ON profile_views (profile_id, viewer_ip_hash, viewed_at DESC);
