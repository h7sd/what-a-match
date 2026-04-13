/*
  # Fix Empty Profile URLs

  1. Changes
    - Convert empty strings to NULL for all URL columns in profiles table
    - This ensures proper fallback behavior in the frontend
    
  2. Affected Columns
    - avatar_url
    - background_url  
    - background_video_url
    - custom_cursor_url
    - og_image_url
    - og_icon_url
    - music_url
    
  3. Security
    - No RLS changes needed (data cleanup only)
*/

-- Convert empty strings to NULL in profiles table
UPDATE profiles SET avatar_url = NULL WHERE avatar_url = '';
UPDATE profiles SET background_url = NULL WHERE background_url = '';
UPDATE profiles SET background_video_url = NULL WHERE background_video_url = '';
UPDATE profiles SET custom_cursor_url = NULL WHERE custom_cursor_url = '';
UPDATE profiles SET og_image_url = NULL WHERE og_image_url = '';
UPDATE profiles SET og_icon_url = NULL WHERE og_icon_url = '';
UPDATE profiles SET music_url = NULL WHERE music_url = '';
