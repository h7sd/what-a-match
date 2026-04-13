/*
  # Fix Missing Tables and Foreign Keys (v2)

  1. New Tables
    - `user_notifications` - User notification system
    - `badge_events` - Badge hunt/steal events

  2. Changes
    - Clean up orphaned records in user_badges
    - Add foreign key constraint from user_badges to global_badges
    - Add foreign key constraint from user_badges to auth.users

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies for data access
*/

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON user_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON user_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON user_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create badge_events table for hunt/steal events
CREATE TABLE IF NOT EXISTS badge_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  target_badge_id uuid,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  event_data jsonb
);

ALTER TABLE badge_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active badge events"
  ON badge_events FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage badge events"
  ON badge_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Delete orphaned user_badges records (users that don't exist in auth.users)
DELETE FROM user_badges
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Delete orphaned user_badges records (badges that don't exist in global_badges)
DELETE FROM user_badges
WHERE badge_id NOT IN (SELECT id FROM global_badges);

-- Add foreign key constraints to user_badges if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'user_badges_badge_id_fkey'
    AND table_name = 'user_badges'
  ) THEN
    ALTER TABLE user_badges
      ADD CONSTRAINT user_badges_badge_id_fkey
      FOREIGN KEY (badge_id)
      REFERENCES global_badges(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'user_badges_user_id_fkey'
    AND table_name = 'user_badges'
  ) THEN
    ALTER TABLE user_badges
      ADD CONSTRAINT user_badges_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_badge_events_is_active ON badge_events(is_active);
CREATE INDEX IF NOT EXISTS idx_badge_events_target_badge ON badge_events(target_badge_id);
