/*
  # Add Spotify Widget Toggle to Profiles

  1. Changes
    - Add `show_spotify_widget` boolean column to profiles table
      Default TRUE so existing users with Discord connected see it immediately
      Users can toggle it off in their dashboard settings

  2. Notes
    - The Spotify widget shows the currently playing Spotify track via Lanyard/Discord presence
    - Requires discord_user_id to be set on the profile
    - Default true = opt-out behavior (show by default, users can hide it)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'show_spotify_widget'
  ) THEN
    ALTER TABLE profiles ADD COLUMN show_spotify_widget boolean DEFAULT true;
  END IF;
END $$;
