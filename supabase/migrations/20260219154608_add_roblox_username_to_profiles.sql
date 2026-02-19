/*
  # Add roblox_username to profiles

  1. Changes
    - Adds `roblox_username` column (text, nullable) to the `profiles` table
    - Allows users to set their Roblox username for the 3D avatar viewer on their profile
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'roblox_username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN roblox_username text;
  END IF;
END $$;
