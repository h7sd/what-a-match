/*
  # Fix badge_events table - add missing columns

  1. Modified Tables
    - `badge_events`
      - Added `name` (text, not null, default '') - Event display name
      - Added `starts_at` (timestamptz, default now()) - Event start time
      - Added `ends_at` (timestamptz, nullable) - Event end time
      - Added `steal_duration_hours` (integer, nullable) - Duration for steal events

  2. Notes
    - These columns are expected by the frontend code and TypeScript types
    - The `description` column was added in a previous migration
    - Using safe IF NOT EXISTS checks to prevent errors
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'badge_events' AND column_name = 'name'
  ) THEN
    ALTER TABLE badge_events ADD COLUMN name text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'badge_events' AND column_name = 'starts_at'
  ) THEN
    ALTER TABLE badge_events ADD COLUMN starts_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'badge_events' AND column_name = 'ends_at'
  ) THEN
    ALTER TABLE badge_events ADD COLUMN ends_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'badge_events' AND column_name = 'steal_duration_hours'
  ) THEN
    ALTER TABLE badge_events ADD COLUMN steal_duration_hours integer;
  END IF;
END $$;
