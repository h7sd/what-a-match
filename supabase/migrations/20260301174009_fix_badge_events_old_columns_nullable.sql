/*
  # Fix badge_events old columns - make nullable

  1. Modified Tables
    - `badge_events`
      - `start_time` changed from NOT NULL to nullable with default now()
      - `end_time` changed from NOT NULL to nullable

  2. Notes
    - The frontend code uses `starts_at`/`ends_at` columns (added previously)
    - The old `start_time`/`end_time` columns are NOT NULL without defaults,
      causing inserts to fail with "null value in column start_time violates not-null constraint"
    - Making them nullable fixes the insert error while preserving any existing data
*/

ALTER TABLE badge_events ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE badge_events ALTER COLUMN start_time SET DEFAULT now();
ALTER TABLE badge_events ALTER COLUMN end_time DROP NOT NULL;
