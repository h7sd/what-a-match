/*
  # Add username and email columns to banned_users

  The ban-user edge function tries to insert username and email into banned_users,
  but these columns were missing, causing the ban to fail.

  1. Changes
    - Add `username` (text) column to banned_users
    - Add `email` (text, nullable) column to banned_users
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'banned_users' AND column_name = 'username'
  ) THEN
    ALTER TABLE banned_users ADD COLUMN username text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'banned_users' AND column_name = 'email'
  ) THEN
    ALTER TABLE banned_users ADD COLUMN email text;
  END IF;
END $$;
