/*
  # Revert Storage URLs to Old Supabase Project

  Reverts the URL migration back to the old project (cjulgfbmcnmrkvnzkpym).
*/

-- Revert profiles table: avatar_url
UPDATE profiles
SET avatar_url = REPLACE(avatar_url, 'nuszlhxbyxdjlaubuwzd.supabase.co', 'cjulgfbmcnmrkvnzkpym.supabase.co')
WHERE avatar_url LIKE '%nuszlhxbyxdjlaubuwzd.supabase.co%';

-- Revert profiles table: background_url
UPDATE profiles
SET background_url = REPLACE(background_url, 'nuszlhxbyxdjlaubuwzd.supabase.co', 'cjulgfbmcnmrkvnzkpym.supabase.co')
WHERE background_url LIKE '%nuszlhxbyxdjlaubuwzd.supabase.co%';

-- Revert profiles table: background_video_url
UPDATE profiles
SET background_video_url = REPLACE(background_video_url, 'nuszlhxbyxdjlaubuwzd.supabase.co', 'cjulgfbmcnmrkvnzkpym.supabase.co')
WHERE background_video_url LIKE '%nuszlhxbyxdjlaubuwzd.supabase.co%';

-- Revert profiles table: custom_cursor_url
UPDATE profiles
SET custom_cursor_url = REPLACE(custom_cursor_url, 'nuszlhxbyxdjlaubuwzd.supabase.co', 'cjulgfbmcnmrkvnzkpym.supabase.co')
WHERE custom_cursor_url LIKE '%nuszlhxbyxdjlaubuwzd.supabase.co%';

-- Revert profiles table: og_image_url
UPDATE profiles
SET og_image_url = REPLACE(og_image_url, 'nuszlhxbyxdjlaubuwzd.supabase.co', 'cjulgfbmcnmrkvnzkpym.supabase.co')
WHERE og_image_url LIKE '%nuszlhxbyxdjlaubuwzd.supabase.co%';

-- Revert profiles table: og_icon_url
UPDATE profiles
SET og_icon_url = REPLACE(og_icon_url, 'nuszlhxbyxdjlaubuwzd.supabase.co', 'cjulgfbmcnmrkvnzkpym.supabase.co')
WHERE og_icon_url LIKE '%nuszlhxbyxdjlaubuwzd.supabase.co%';

-- Revert profiles table: music_url
UPDATE profiles
SET music_url = REPLACE(music_url, 'nuszlhxbyxdjlaubuwzd.supabase.co', 'cjulgfbmcnmrkvnzkpym.supabase.co')
WHERE music_url LIKE '%nuszlhxbyxdjlaubuwzd.supabase.co%';

-- Revert global_badges table: icon_url
UPDATE global_badges
SET icon_url = REPLACE(icon_url, 'nuszlhxbyxdjlaubuwzd.supabase.co', 'cjulgfbmcnmrkvnzkpym.supabase.co')
WHERE icon_url LIKE '%nuszlhxbyxdjlaubuwzd.supabase.co%';

-- Revert friend_badges table: icon_url
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'friend_badges') THEN
    UPDATE friend_badges
    SET icon_url = REPLACE(icon_url, 'nuszlhxbyxdjlaubuwzd.supabase.co', 'cjulgfbmcnmrkvnzkpym.supabase.co')
    WHERE icon_url LIKE '%nuszlhxbyxdjlaubuwzd.supabase.co%';
  END IF;
END $$;
