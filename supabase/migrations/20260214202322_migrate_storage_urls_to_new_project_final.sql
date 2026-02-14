/*
  # Migrate Storage URLs to New Supabase Project

  Migrates all storage URLs from the old project (cjulgfbmcnmrkvnzkpym) to the new project (nuszlhxbyxdjlaubuwzd).

  1. Changes
    - Updates avatar_url in profiles table
    - Updates background_url in profiles table
    - Updates background_video_url in profiles table
    - Updates custom_cursor_url in profiles table
    - Updates og_image_url in profiles table
    - Updates og_icon_url in profiles table
    - Updates music_url in profiles table
    - Updates icon_url in global_badges table
    - Updates icon_url in friend_badges table (if exists)

  2. Notes
    - This migration updates all Supabase storage URLs across the database
    - Only affects URLs containing the old project reference
    - Uses REPLACE function to update URLs in-place
*/

-- Update profiles table: avatar_url
UPDATE profiles
SET avatar_url = REPLACE(avatar_url, 'cjulgfbmcnmrkvnzkpym.supabase.co', 'nuszlhxbyxdjlaubuwzd.supabase.co')
WHERE avatar_url LIKE '%cjulgfbmcnmrkvnzkpym.supabase.co%';

-- Update profiles table: background_url
UPDATE profiles
SET background_url = REPLACE(background_url, 'cjulgfbmcnmrkvnzkpym.supabase.co', 'nuszlhxbyxdjlaubuwzd.supabase.co')
WHERE background_url LIKE '%cjulgfbmcnmrkvnzkpym.supabase.co%';

-- Update profiles table: background_video_url
UPDATE profiles
SET background_video_url = REPLACE(background_video_url, 'cjulgfbmcnmrkvnzkpym.supabase.co', 'nuszlhxbyxdjlaubuwzd.supabase.co')
WHERE background_video_url LIKE '%cjulgfbmcnmrkvnzkpym.supabase.co%';

-- Update profiles table: custom_cursor_url
UPDATE profiles
SET custom_cursor_url = REPLACE(custom_cursor_url, 'cjulgfbmcnmrkvnzkpym.supabase.co', 'nuszlhxbyxdjlaubuwzd.supabase.co')
WHERE custom_cursor_url LIKE '%cjulgfbmcnmrkvnzkpym.supabase.co%';

-- Update profiles table: og_image_url
UPDATE profiles
SET og_image_url = REPLACE(og_image_url, 'cjulgfbmcnmrkvnzkpym.supabase.co', 'nuszlhxbyxdjlaubuwzd.supabase.co')
WHERE og_image_url LIKE '%cjulgfbmcnmrkvnzkpym.supabase.co%';

-- Update profiles table: og_icon_url
UPDATE profiles
SET og_icon_url = REPLACE(og_icon_url, 'cjulgfbmcnmrkvnzkpym.supabase.co', 'nuszlhxbyxdjlaubuwzd.supabase.co')
WHERE og_icon_url LIKE '%cjulgfbmcnmrkvnzkpym.supabase.co%';

-- Update profiles table: music_url
UPDATE profiles
SET music_url = REPLACE(music_url, 'cjulgfbmcnmrkvnzkpym.supabase.co', 'nuszlhxbyxdjlaubuwzd.supabase.co')
WHERE music_url LIKE '%cjulgfbmcnmrkvnzkpym.supabase.co%';

-- Update global_badges table: icon_url
UPDATE global_badges
SET icon_url = REPLACE(icon_url, 'cjulgfbmcnmrkvnzkpym.supabase.co', 'nuszlhxbyxdjlaubuwzd.supabase.co')
WHERE icon_url LIKE '%cjulgfbmcnmrkvnzkpym.supabase.co%';

-- Update friend_badges table: icon_url (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'friend_badges') THEN
    UPDATE friend_badges
    SET icon_url = REPLACE(icon_url, 'cjulgfbmcnmrkvnzkpym.supabase.co', 'nuszlhxbyxdjlaubuwzd.supabase.co')
    WHERE icon_url LIKE '%cjulgfbmcnmrkvnzkpym.supabase.co%';
  END IF;
END $$;
