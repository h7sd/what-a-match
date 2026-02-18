/*
  # Add used_at column to verification_codes

  ## Problem
  The verify-code edge function queries .is("used_at", null) but the table
  only has a boolean "used" column, not a timestamp "used_at" column.

  ## Changes
  - Add used_at (timestamptz, nullable) column to verification_codes
  - This allows the edge function to mark codes as used with a timestamp
*/

ALTER TABLE verification_codes
  ADD COLUMN IF NOT EXISTS used_at timestamptz DEFAULT NULL;
