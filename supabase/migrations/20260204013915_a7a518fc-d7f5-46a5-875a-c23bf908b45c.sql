-- Fix: Ensure hunt badge is visible on the holder profile by forcing show_badges=true
-- and prevent holders from hiding badges during an active hunt event.

CREATE OR REPLACE FUNCTION public.assign_hunt_badge_on_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_random_user_id uuid;
  v_should_assign boolean;
  v_current_holders_count integer;
BEGIN
  -- Only for hunt events with a target badge
  IF NEW.event_type <> 'hunt' OR NEW.target_badge_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_should_assign := false;

  -- Determine if this row just became active
  IF TG_OP = 'INSERT' THEN
    v_should_assign := (COALESCE(NEW.is_active, false) = true);
  ELSIF TG_OP = 'UPDATE' THEN
    v_should_assign := (
      COALESCE(NEW.is_active, false) = true
      AND (COALESCE(OLD.is_active, false) IS DISTINCT FROM true)
    );
  END IF;

  -- Repair path: event is active but there is currently NO enabled holder
  IF COALESCE(NEW.is_active, false) = true THEN
    PERFORM 1
    FROM user_badges ub
    WHERE ub.badge_id = NEW.target_badge_id
      AND COALESCE(ub.is_locked, false) = false
      AND ub.is_enabled = true
    LIMIT 1;

    IF NOT FOUND THEN
      v_should_assign := true;
    END IF;
  END IF;

  IF NOT v_should_assign THEN
    RETURN NEW;
  END IF;

  -- First, disable the badge for ALL current owners
  UPDATE user_badges
  SET is_enabled = false
  WHERE badge_id = NEW.target_badge_id;

  -- Count how many users have this badge at all
  SELECT COUNT(*) INTO v_current_holders_count
  FROM user_badges
  WHERE badge_id = NEW.target_badge_id
    AND COALESCE(is_locked, false) = false;

  -- If no one has the badge yet, we need to assign it to a random user
  IF v_current_holders_count = 0 THEN
    -- Pick a random user who has a profile
    SELECT p.user_id INTO v_random_user_id
    FROM profiles p
    ORDER BY random()
    LIMIT 1;

    IF v_random_user_id IS NOT NULL THEN
      -- Insert the badge for this user
      INSERT INTO user_badges (user_id, badge_id, is_enabled, display_order)
      VALUES (v_random_user_id, NEW.target_badge_id, true, 0)
      ON CONFLICT (user_id, badge_id) DO UPDATE SET is_enabled = true;

      -- Force badges visible for the holder
      UPDATE profiles
      SET show_badges = true
      WHERE user_id = v_random_user_id;

      RAISE NOTICE 'Hunt badge assigned to new random user: %', v_random_user_id;
    END IF;
  ELSE
    -- Pick a random existing eligible owner
    SELECT ub.user_id INTO v_random_user_id
    FROM user_badges ub
    JOIN profiles p ON p.user_id = ub.user_id
    WHERE ub.badge_id = NEW.target_badge_id
      AND COALESCE(ub.is_locked, false) = false
    ORDER BY random()
    LIMIT 1;

    IF v_random_user_id IS NOT NULL THEN
      -- Enable ONLY for the randomly selected user
      UPDATE user_badges
      SET is_enabled = true
      WHERE badge_id = NEW.target_badge_id
        AND user_id = v_random_user_id;

      -- Force badges visible for the holder
      UPDATE profiles
      SET show_badges = true
      WHERE user_id = v_random_user_id;

      RAISE NOTICE 'Hunt badge enabled for random existing owner: %', v_random_user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Prevent the current hunt holder from hiding badges during an active hunt
CREATE OR REPLACE FUNCTION public.prevent_hunt_badge_hide()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF COALESCE(OLD.show_badges, true) = true
     AND COALESCE(NEW.show_badges, true) = false THEN
    IF EXISTS (
      SELECT 1
      FROM badge_events be
      JOIN user_badges ub ON ub.badge_id = be.target_badge_id
      WHERE be.is_active = true
        AND be.event_type = 'hunt'
        AND ub.user_id = NEW.user_id
        AND ub.is_enabled = true
        AND COALESCE(ub.is_locked, false) = false
    ) THEN
      -- Only block if this is a user action on their own profile
      IF NEW.user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot hide badges while holding the hunt badge during an active hunt event';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS prevent_hunt_badge_hide_trigger ON public.profiles;
CREATE TRIGGER prevent_hunt_badge_hide_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_hunt_badge_hide();

-- Also force show_badges=true for the new hunt owner when a hunt succeeds
CREATE OR REPLACE FUNCTION public.steal_badge(p_victim_username text, p_badge_name text, p_event_id uuid DEFAULT NULL::uuid)
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

  -- HUNT EVENT LOGIC
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
      AND bs.returned = false
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
    
    -- NO LIMIT CHECK FOR HUNT EVENTS - anyone can hunt multiple times
    
    -- Mark all previous steals for this event as returned (chain moves on)
    UPDATE badge_steals
    SET returned = true, returned_at = now()
    WHERE event_id = v_event.id 
      AND badge_id = v_badge_id 
      AND returned = false;
    
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
    INSERT INTO badge_steals (event_id, badge_id, thief_user_id, victim_user_id, returns_at)
    VALUES (v_event.id, v_badge_id, v_thief_id, v_victim_id, now() + interval '100 years');
    
    RETURN QUERY SELECT true, 'Badge hunted successfully!'::text, (SELECT name FROM global_badges WHERE id = v_badge_id);
    RETURN;
  END IF;

  -- STEAL EVENT LOGIC (original behavior)
  -- Get badge by name from victim
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
    SELECT 1 FROM badge_steals 
    WHERE thief_user_id = v_thief_id 
      AND event_id = v_event.id
  ) THEN
    RETURN QUERY SELECT false, 'You already stole a badge in this event'::text, NULL::text;
    RETURN;
  END IF;

  -- Disable the badge for victim
  UPDATE user_badges
  SET is_enabled = false
  WHERE badge_id = v_badge_id AND user_id = v_victim_id;

  -- Give badge to thief (or enable if already has)
  INSERT INTO user_badges (user_id, badge_id, is_enabled, display_order)
  VALUES (v_thief_id, v_badge_id, true, 0)
  ON CONFLICT (user_id, badge_id) 
  DO UPDATE SET is_enabled = true;

  -- Record the steal
  INSERT INTO badge_steals (event_id, badge_id, thief_user_id, victim_user_id, returns_at)
  VALUES (v_event.id, v_badge_id, v_thief_id, v_victim_id, now() + (v_duration_hours || ' hours')::interval);

  RETURN QUERY SELECT true, 'Badge stolen!'::text, (SELECT name FROM global_badges WHERE id = v_badge_id);
END;
$function$;

-- Ensure trigger exists for assignment
DROP TRIGGER IF EXISTS assign_hunt_badge_trigger ON public.badge_events;
CREATE TRIGGER assign_hunt_badge_trigger
BEFORE INSERT OR UPDATE ON public.badge_events
FOR EACH ROW
EXECUTE FUNCTION assign_hunt_badge_on_activation();