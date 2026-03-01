/*
  # Add description column to badge_events

  1. Modified Tables
    - `badge_events`
      - Added `description` (text, nullable) - Human-readable description of the event

  2. Notes
    - Column is nullable with no default, matching existing code expectations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'badge_events' AND column_name = 'description'
  ) THEN
    ALTER TABLE badge_events ADD COLUMN description text;
  END IF;
END $$;
