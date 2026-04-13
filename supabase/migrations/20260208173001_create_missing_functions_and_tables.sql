/*
  # Create Missing Functions and Tables
  
  1. New Tables
    - `live_feed` - For displaying recent case openings
    - `case_opening_history` - For tracking user case opening history
  
  2. New Functions
    - `get_alias_requests_for_me()` - Secure function to get alias requests for current user
    - `get_admin_chat_notifications()` - Admin function to get chat notifications
    - `update_user_streak()` - Function to track user login streaks
    - `cleanup_live_feed()` - Function to clean old live feed entries
  
  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for each table
    - Functions use SECURITY DEFINER for controlled access
*/

-- Create live_feed table
CREATE TABLE IF NOT EXISTS live_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  case_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_rarity TEXT NOT NULL,
  item_value INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create case_opening_history table
CREATE TABLE IF NOT EXISTS case_opening_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  case_id UUID REFERENCES cases(id),
  item_won_id UUID,
  coins_spent INTEGER NOT NULL,
  opened_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE live_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_opening_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_feed
DROP POLICY IF EXISTS "Anyone can view live feed" ON live_feed;
CREATE POLICY "Anyone can view live feed"
  ON live_feed FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can insert live feed" ON live_feed;
CREATE POLICY "Service role can insert live feed"
  ON live_feed FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can delete old feed" ON live_feed;
CREATE POLICY "Service role can delete old feed"
  ON live_feed FOR DELETE
  TO service_role
  USING (true);

-- RLS Policies for case_opening_history
DROP POLICY IF EXISTS "Users can view own history" ON case_opening_history;
CREATE POLICY "Users can view own history"
  ON case_opening_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert history" ON case_opening_history;
CREATE POLICY "Service role can insert history"
  ON case_opening_history FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_feed_created ON live_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_user_opened ON case_opening_history(user_id, opened_at DESC);

-- Function: cleanup_live_feed
CREATE OR REPLACE FUNCTION cleanup_live_feed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM live_feed
  WHERE id NOT IN (
    SELECT id FROM live_feed
    ORDER BY created_at DESC
    LIMIT 100
  );
END;
$$;

-- Function: get_alias_requests_for_me
CREATE OR REPLACE FUNCTION public.get_alias_requests_for_me()
RETURNS TABLE (
  id uuid,
  requested_alias text,
  requester_id uuid,
  target_user_id uuid,
  status text,
  responded_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    requested_alias,
    requester_id,
    target_user_id,
    status,
    responded_at,
    created_at
  FROM public.alias_requests
  WHERE target_user_id = auth.uid();
$$;

-- Function: get_admin_chat_notifications
CREATE OR REPLACE FUNCTION public.get_admin_chat_notifications()
RETURNS TABLE(
  conversation_id uuid,
  visitor_display text,
  status text,
  last_message_at timestamp with time zone,
  unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access this data
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    CASE 
      WHEN c.user_id IS NOT NULL THEN (
        SELECT COALESCE(p.display_name, p.username, 'User')
        FROM profiles p WHERE p.user_id = c.user_id LIMIT 1
      )
      ELSE 'Guest #' || RIGHT(COALESCE(c.visitor_id, 'unknown'), 6)
    END as visitor_display,
    c.status,
    c.updated_at as last_message_at,
    (
      SELECT COUNT(*) 
      FROM live_chat_messages m 
      WHERE m.conversation_id = c.id 
      AND m.sender_type IN ('user', 'visitor')
      AND m.created_at > COALESCE(
        (SELECT MAX(m2.created_at) FROM live_chat_messages m2 
         WHERE m2.conversation_id = c.id AND m2.sender_type = 'admin'),
        '1970-01-01'::timestamp
      )
    ) as unread_count
  FROM live_chat_conversations c
  WHERE c.status IN ('active', 'waiting_for_agent')
    AND (c.assigned_admin_id IS NULL OR c.assigned_admin_id = auth.uid())
  ORDER BY 
    CASE WHEN c.status = 'waiting_for_agent' THEN 0 ELSE 1 END,
    c.updated_at DESC
  LIMIT 20;
END;
$$;

-- Function: update_user_streak
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak RECORD;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_new_streak INTEGER;
  v_is_new_day BOOLEAN := false;
BEGIN
  -- Get or create streak record
  SELECT * INTO v_streak FROM user_streaks WHERE user_id = p_user_id;
  
  IF v_streak IS NULL THEN
    -- First login ever
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (p_user_id, 1, 1, v_today)
    RETURNING * INTO v_streak;
    
    RETURN jsonb_build_object(
      'current_streak', 1,
      'longest_streak', 1,
      'is_new_day', true,
      'streak_increased', true
    );
  END IF;
  
  -- Check if already logged in today
  IF v_streak.last_activity_date = v_today THEN
    RETURN jsonb_build_object(
      'current_streak', v_streak.current_streak,
      'longest_streak', v_streak.longest_streak,
      'is_new_day', false,
      'streak_increased', false
    );
  END IF;
  
  v_is_new_day := true;
  
  -- Check if consecutive day
  IF v_streak.last_activity_date = v_yesterday THEN
    v_new_streak := v_streak.current_streak + 1;
  ELSE
    -- Streak broken, start fresh
    v_new_streak := 1;
  END IF;
  
  -- Update streak record
  UPDATE user_streaks
  SET 
    current_streak = v_new_streak,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    last_activity_date = v_today,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_streak;
  
  RETURN jsonb_build_object(
    'current_streak', v_streak.current_streak,
    'longest_streak', v_streak.longest_streak,
    'is_new_day', v_is_new_day,
    'streak_increased', v_new_streak > 1 OR (v_new_streak = 1 AND v_is_new_day)
  );
END;
$$;