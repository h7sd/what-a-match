
-- Make hunt badges stealable by extending steal_badge to support hunt events.
-- For hunt events:
-- - Only the event target badge can be stolen
-- - The victim must be the current holder (enabled holder or last thief)
-- - Previous active hold is marked returned so the badge moves along the chain

CREATE OR REPLACE FUNCTION public.steal_badge(
  p_victim_username text,
  p_badge_name text,
  p_event_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(success boolean, message text, stolen_badge_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_thief_id uuid;
  v_victim_id uuid;
  v_badge_id uuid;
  v_badge_name text;
  v_event badge_events%ROWTYPE;
  v_duration_hours integer;
  v_existing_steal badge_steals%ROWTYPE;
  v_current_holder_user_id uuid;
  v_clean_badge_name text;
BEGIN
  v_thief_id := auth.uid();

  IF v_thief_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'::text, NULL::text;
    RETURN;
  END IF;

  -- Get victim user_id
  SELECT user_id INTO v_victim_id
  FROM profiles
  WHERE lower(username) = lower(p_victim_username);

  IF v_victim_id IS NULL THEN
    RETURN QUERY SELECT false, 'User not found'::text, NULL::text;
    RETURN;
  END IF;

  -- Cannot steal from yourself
  IF v_victim_id = v_thief_id THEN
    RETURN QUERY SELECT false, 'Cannot steal from yourself'::text, NULL::text;
    RETURN;
  END IF;

  -- Resolve active event
  IF p_event_id IS NOT NULL THEN
    SELECT * INTO v_event
    FROM badge_events
    WHERE id = p_event_id AND is_active = true;
  ELSE
    SELECT * INTO v_event
    FROM badge_events
    WHERE is_active = true AND event_type = 'steal'
    LIMIT 1;
  END IF;

  IF v_event IS NULL THEN
    RETURN QUERY SELECT false, 'No active event'::text, NULL::text;
    RETURN;
  END IF;

  v_duration_hours := COALESCE(v_event.steal_duration_hours, 168);

  -- HUNT MODE
  IF v_event.event_type = 'hunt' THEN
    IF v_event.target_badge_id IS NULL THEN
      RETURN QUERY SELECT false, 'No hunt target badge configured'::text, NULL::text;
      RETURN;
    END IF;

    v_badge_id := v_event.target_badge_id;

    SELECT name INTO v_badge_name
    FROM global_badges
    WHERE id = v_badge_id;

    IF v_badge_name IS NULL THEN
      RETURN QUERY SELECT false, 'Badge not found'::text, NULL::text;
      RETURN;
    END IF;

    -- Determine current holder:
    -- 1) last thief in this hunt event (badge currently "stolen")
    SELECT bs.thief_user_id INTO v_current_holder_user_id
    FROM badge_steals bs
    WHERE bs.event_id = v_event.id
      AND bs.badge_id = v_badge_id
      AND bs.returned = false
    ORDER BY bs.stolen_at DESC
    LIMIT 1;

    -- 2) otherwise: enabled holder (randomly assigned on activation)
    IF v_current_holder_user_id IS NULL THEN
      SELECT ub.user_id INTO v_current_holder_user_id
      FROM user_badges ub
      WHERE ub.badge_id = v_badge_id
        AND ub.is_enabled = true
        AND COALESCE(ub.is_locked, false) = false
      LIMIT 1;
    END IF;

    IF v_current_holder_user_id IS NULL THEN
      RETURN QUERY SELECT false, 'No holder assigned'::text, v_badge_name;
      RETURN;
    END IF;

    IF v_victim_id <> v_current_holder_user_id THEN
      RETURN QUERY SELECT false, 'Target moved — refresh and try again'::text, v_badge_name;
      RETURN;
    END IF;

    -- Optional anti-spam: one steal per user per event
    IF EXISTS (
      SELECT 1 FROM badge_steals
      WHERE event_id = v_event.id AND thief_user_id = v_thief_id AND returned = false
    ) THEN
      RETURN QUERY SELECT false, 'You have already stolen a badge in this event'::text, v_badge_name;
      RETURN;
    END IF;

    -- Move the badge along the chain: close any previous active hold for this badge+event
    UPDATE badge_steals
    SET returned = true, returned_at = now()
    WHERE event_id = v_event.id
      AND badge_id = v_badge_id
      AND returned = false;

    -- Perform the steal
    INSERT INTO badge_steals (event_id, badge_id, thief_user_id, victim_user_id, returns_at)
    VALUES (v_event.id, v_badge_id, v_thief_id, v_victim_id, now() + (v_duration_hours || ' hours')::interval);

    RETURN QUERY SELECT true, 'Badge stolen successfully!'::text, v_badge_name;
    RETURN;
  END IF;

  -- STEAL MODE (existing behavior)
  -- Normalize name in case client sends "(stolen)" suffix
  v_clean_badge_name := regexp_replace(COALESCE(p_badge_name, ''), '\\s*\\(stolen\\)\\s*$', '', 'i');

  SELECT id, name INTO v_badge_id, v_badge_name
  FROM global_badges
  WHERE lower(name) = lower(v_clean_badge_name);

  IF v_badge_id IS NULL THEN
    RETURN QUERY SELECT false, 'Badge not found'::text, NULL::text;
    RETURN;
  END IF;

  -- Check if victim actually has this badge enabled
  IF NOT EXISTS (
    SELECT 1 FROM user_badges
    WHERE user_id = v_victim_id AND badge_id = v_badge_id AND is_enabled = true
  ) THEN
    RETURN QUERY SELECT false, 'User does not have this badge'::text, NULL::text;
    RETURN;
  END IF;

  -- Check if badge is already stolen from this victim
  SELECT * INTO v_existing_steal
  FROM badge_steals
  WHERE badge_id = v_badge_id
    AND victim_user_id = v_victim_id
    AND returned = false
    AND returns_at > now();

  IF v_existing_steal IS NOT NULL THEN
    RETURN QUERY SELECT false, 'Badge is already stolen by someone else'::text, NULL::text;
    RETURN;
  END IF;

  -- Check if thief already stole in this event
  IF EXISTS (
    SELECT 1 FROM badge_steals
    WHERE event_id = v_event.id AND thief_user_id = v_thief_id AND returned = false
  ) THEN
    RETURN QUERY SELECT false, 'You have already stolen a badge in this event'::text, NULL::text;
    RETURN;
  END IF;

  INSERT INTO badge_steals (event_id, badge_id, thief_user_id, victim_user_id, returns_at)
  VALUES (v_event.id, v_badge_id, v_thief_id, v_victim_id, now() + (v_duration_hours || ' hours')::interval);

  RETURN QUERY SELECT true, 'Badge stolen successfully!'::text, v_badge_name;
END;
$function$;
