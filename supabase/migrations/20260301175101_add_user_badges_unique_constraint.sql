/*
  # Add unique constraint on user_badges(user_id, badge_id)

  1. Modified Tables
    - `user_badges`: Added unique constraint on (user_id, badge_id)

  2. Notes
    - Required for ON CONFLICT (user_id, badge_id) DO UPDATE in hunt/steal functions
    - First removes any duplicates (keeps the most recent one)
*/

DO $$
BEGIN
  DELETE FROM user_badges a
  USING user_badges b
  WHERE a.user_id = b.user_id
    AND a.badge_id = b.badge_id
    AND a.id < b.id;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'user_badges'::regclass
    AND conname = 'user_badges_user_id_badge_id_key'
  ) THEN
    ALTER TABLE user_badges ADD CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);
  END IF;
END $$;
