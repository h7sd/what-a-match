/*
  # Create Ban Check RPC Function

  1. New Functions
    - `check_user_ban_status` - Checks if a user is banned
    - Returns ban status and appeal eligibility

  2. Security
    - SECURITY DEFINER to access banned_users table safely
    - Returns minimal information
*/

-- Create function to check if user is banned
CREATE OR REPLACE FUNCTION check_user_ban_status(p_user_id uuid)
RETURNS TABLE (
  is_banned boolean,
  can_appeal boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true as is_banned,
    CASE 
      WHEN bu.appeal_submitted_at IS NULL THEN true
      ELSE false
    END as can_appeal
  FROM banned_users bu
  WHERE bu.user_id = p_user_id
    AND (bu.ban_expires_at IS NULL OR bu.ban_expires_at > now())
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false as is_banned, false as can_appeal;
  END IF;
END;
$$;

-- Ensure banned_users table has the necessary columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'banned_users' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE banned_users ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'banned_users' AND column_name = 'reason'
  ) THEN
    ALTER TABLE banned_users ADD COLUMN reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'banned_users' AND column_name = 'banned_at'
  ) THEN
    ALTER TABLE banned_users ADD COLUMN banned_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'banned_users' AND column_name = 'banned_by'
  ) THEN
    ALTER TABLE banned_users ADD COLUMN banned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'banned_users' AND column_name = 'ban_expires_at'
  ) THEN
    ALTER TABLE banned_users ADD COLUMN ban_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'banned_users' AND column_name = 'appeal_submitted_at'
  ) THEN
    ALTER TABLE banned_users ADD COLUMN appeal_submitted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'banned_users' AND column_name = 'appeal_text'
  ) THEN
    ALTER TABLE banned_users ADD COLUMN appeal_text text;
  END IF;
END $$;
