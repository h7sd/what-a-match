-- Fix badge stealing: make STEAL events purely time-based via badge_steals records (no user_badges toggles)
-- and ensure automatic returns only apply to STEAL events.

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
  v_event record;
  v_duration_hours int;
  v_current_holder_id uuid;
BEGIN
  v_thief_id := auth.uid();

  IF v_thief_id IS NULL THEN
    RETURN QUERY SELECT false, 'Not authenticated'::text, NULL::text;
    RETURN;
  END IF;

  -- Get victim user_id from username
  SELECT p.user_id INTO v_victim_id
  FROM profiles p
  WHERE lower(p.username) = lower(p_victim_username);

  IF v_victim_id IS NULL THEN
    RETURN QUERY SELECT false, 'User not found'::text, NULL::text;
    RETURN;
  END IF;

  IF v_thief_id = v_victim_id THEN
    RETURN QUERY SELECT false, 'Cannot hunt your own badge'::text, NULL::text;
    RETURN;
  END IF;

  -- Get the active event
  IF p_event_id IS NOT NULL THEN
    SELECT * INTO v_event FROM badge_events WHERE id = p_event_id AND is_active = true;
  ELSE
    SELECT * INTO v_event FROM badge_events WHERE is_active = true ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF v_event IS NULL THEN
    RETURN QUERY SELECT false, 'No active event'::text, NULL::text;
    RETURN;
  END IF;

  v_duration_hours := COALESCE(v_event.steal_duration_hours, 168);

  -- HUNT EVENT LOGIC (unchanged: permanent transfer via user_badges toggles)
  IF v_event.event_type = 'hunt' THEN
    -- For hunt events, only the target badge can be hunted
    IF v_event.target_badge_id IS NULL THEN
      RETURN QUERY SELECT false, 'Hunt event has no target badge'::text, NULL::text;
      RETURN;
    END IF;

    v_badge_id := v_event.target_badge_id;

    -- Check who currently holds the badge (either original owner with is_enabled=true, or last thief)
    -- First check if there's an active steal
    SELECT bs.thief_user_id INTO v_current_holder_id
    FROM badge_steals bs
    WHERE bs.event_id = v_event.id
      AND bs.badge_id = v_badge_id
      AND COALESCE(bs.returned, false) = false
    ORDER BY bs.stolen_at DESC
    LIMIT 1;

    -- If no active steal, check who has the badge enabled
    IF v_current_holder_id IS NULL THEN
      SELECT ub.user_id INTO v_current_holder_id
      FROM user_badges ub
      WHERE ub.badge_id = v_badge_id
        AND ub.is_enabled = true
        AND COALESCE(ub.is_locked, false) = false
      LIMIT 1;
    END IF;

    -- Victim must be the current holder
    IF v_current_holder_id IS NULL OR v_current_holder_id != v_victim_id THEN
      RETURN QUERY SELECT false, 'This user is not the current badge holder'::text, NULL::text;
      RETURN;
    END IF;

    -- Mark all previous steals for this event as returned (chain moves on)
    UPDATE badge_steals
    SET returned = true, returned_at = now()
    WHERE event_id = v_event.id
      AND badge_id = v_badge_id
      AND COALESCE(returned, false) = false;

    -- Disable the badge for the victim
    UPDATE user_badges
    SET is_enabled = false
    WHERE badge_id = v_badge_id AND user_id = v_victim_id;

    -- Enable for thief (or insert if they don't have it)
    INSERT INTO user_badges (user_id, badge_id, is_enabled, display_order)
    VALUES (v_thief_id, v_badge_id, true, 0)
    ON CONFLICT (user_id, badge_id)
    DO UPDATE SET is_enabled = true;

    -- Force badges visible for the new holder
    UPDATE profiles
    SET show_badges = true
    WHERE user_id = v_thief_id;

    -- Record the steal (with far future returns_at since it won't be returned automatically)
    INSERT INTO badge_steals (event_id, badge_id, thief_user_id, victim_user_id, returns_at, returned)
    VALUES (v_event.id, v_badge_id, v_thief_id, v_victim_id, now() + interval '100 years', false);

    RETURN QUERY SELECT true, 'Badge hunted successfully!'::text, (SELECT name FROM global_badges WHERE id = v_badge_id);
    RETURN;
  END IF;

  -- STEAL EVENT LOGIC (fixed): do NOT mutate user_badges. Visibility is driven by badge_steals.

  -- Get badge by name from victim (must be enabled and not locked)
  SELECT ub.badge_id INTO v_badge_id
  FROM user_badges ub
  JOIN global_badges gb ON gb.id = ub.badge_id
  WHERE ub.user_id = v_victim_id
    AND lower(gb.name) = lower(p_badge_name)
    AND ub.is_enabled = true
    AND COALESCE(ub.is_locked, false) = false;

  IF v_badge_id IS NULL THEN
    RETURN QUERY SELECT false, 'Badge not found or not stealable'::text, NULL::text;
    RETURN;
  END IF;

  -- Check if thief already stole in this event (only for steal events)
  IF EXISTS (
    SELECT 1 FROM badge_steals bs
    WHERE bs.thief_user_id = v_thief_id
      AND bs.event_id = v_event.id
      AND EXISTS (SELECT 1 FROM badge_events be WHERE be.id = bs.event_id AND be.event_type = 'steal')
  ) THEN
    RETURN QUERY SELECT false, 'You already stole a badge in this event'::text, NULL::text;
    RETURN;
  END IF;

  -- Record the steal (time-boxed)
  INSERT INTO badge_steals (event_id, badge_id, thief_user_id, victim_user_id, returns_at, returned)
  VALUES (
    v_event.id,
    v_badge_id,
    v_thief_id,
    v_victim_id,
    now() + (v_duration_hours || ' hours')::interval,
    false
  );

  RETURN QUERY SELECT true, 'Badge stolen!'::text, (SELECT name FROM global_badges WHERE id = v_badge_id);
END;
$function$;


CREATE OR REPLACE FUNCTION public.return_stolen_badges()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  returned_count integer;
BEGIN
  -- Only return STEAL-event steals.
  UPDATE public.badge_steals bs
  SET returned = true,
      returned_at = now()
  FROM public.badge_events be
  WHERE be.id = bs.event_id
    AND be.event_type = 'steal'
    AND COALESCE(bs.returned, false) = false
    AND bs.returns_at <= now();

  GET DIAGNOSTICS returned_count = ROW_COUNT;
  RETURN returned_count;
END;
$function$;


CREATE OR REPLACE FUNCTION public.return_badges_on_event_deactivation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger when is_active changes from true to false
  IF OLD.is_active = true AND NEW.is_active = false THEN
    -- Only auto-return for STEAL events.
    IF NEW.event_type = 'steal' THEN
      UPDATE public.badge_steals
      SET returned = true, returned_at = now()
      WHERE event_id = NEW.id
        AND COALESCE(returned, false) = false;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
