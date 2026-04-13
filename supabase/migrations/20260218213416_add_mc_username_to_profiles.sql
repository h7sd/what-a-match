/*
  # Add Minecraft Username to Profiles

  1. Changes
    - Adds `mc_username` column to the `profiles` table
      - Stores the player's Minecraft Java Edition username (IGN)
      - Used to fetch and display their 3D skin on their profile page
      - Nullable - only shown when set

  2. Notes
    - No RLS changes needed (profiles table already has proper policies)
    - The column is optional; profiles without it won't show the skin viewer
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'mc_username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN mc_username text DEFAULT NULL;
  END IF;
END $$;
