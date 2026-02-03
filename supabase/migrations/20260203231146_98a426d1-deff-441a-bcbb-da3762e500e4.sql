
-- Function to get the current holder of a hunt badge
-- This tracks the "chain" - if stolen, returns thief, otherwise original holder
CREATE OR REPLACE FUNCTION public.get_hunt_badge_holder(p_event_id uuid)
RETURNS TABLE(username text, user_id uuid) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_badge_id uuid;
  v_current_holder_user_id uuid;
  v_current_holder_username text;
BEGIN
  -- Get the target badge for this hunt event
  SELECT target_badge_id INTO v_target_badge_id
  FROM badge_events
  WHERE id = p_event_id AND event_type = 'hunt';
  
  IF v_target_badge_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Check if there's an active steal for this badge
  SELECT bs.thief_user_id INTO v_current_holder_user_id
  FROM badge_steals bs
  WHERE bs.badge_id = v_target_badge_id
    AND bs.returned = false
  ORDER BY bs.stolen_at DESC
  LIMIT 1;
  
  -- If stolen, return the thief
  IF v_current_holder_user_id IS NOT NULL THEN
    SELECT p.username INTO v_current_holder_username
    FROM profiles p
    WHERE p.user_id = v_current_holder_user_id;
    
    RETURN QUERY SELECT v_current_holder_username, v_current_holder_user_id;
    RETURN;
  END IF;
  
  -- Otherwise, find a random owner of this badge
  SELECT p.username, ub.user_id INTO v_current_holder_username, v_current_holder_user_id
  FROM user_badges ub
  JOIN profiles p ON ub.user_id = p.user_id
  WHERE ub.badge_id = v_target_badge_id
    AND ub.is_enabled = true
  ORDER BY random()
  LIMIT 1;
  
  IF v_current_holder_user_id IS NOT NULL THEN
    RETURN QUERY SELECT v_current_holder_username, v_current_holder_user_id;
  END IF;
END;
$$;
