-- Fix: Allow admins/service_role to assign the hunt target badge to a random user on event activation
-- and repair active hunt events that have no enabled holder.

CREATE OR REPLACE FUNCTION public.validate_badge_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  badge_record RECORD;
  is_admin BOOLEAN;
  jwt_role text;
  jwt_claims json;
  is_early boolean;
  is_hunt_target boolean;
  already_has boolean;
  early_deadline timestamptz := '2026-02-27T00:00:00Z';
BEGIN
  -- Determine JWT role (service_role bypass support)
  jwt_role := current_setting('request.jwt.claim.role', true);

  IF jwt_role IS NULL THEN
    BEGIN
      jwt_claims := current_setting('request.jwt.claims', true)::json;
      jwt_role := jwt_claims->>'role';
    EXCEPTION WHEN others THEN
      jwt_role := NULL;
    END;
  END IF;

  -- Check if the current user is an admin
  SELECT has_role(auth.uid(), 'admin') INTO is_admin;

  -- Get badge details
  SELECT * INTO badge_record
  FROM public.global_badges
  WHERE id = NEW.badge_id;

  IF badge_record IS NULL THEN
    RAISE EXCEPTION 'Badge not found';
  END IF;

  is_early := (lower(badge_record.name) = 'early');

  -- Is this badge currently the target of an active hunt event?
  SELECT EXISTS (
    SELECT 1
    FROM public.badge_events be
    WHERE be.is_active = true
      AND be.event_type = 'hunt'
      AND be.target_badge_id = NEW.badge_id
  ) INTO is_hunt_target;

  -- Special-case: active HUNT target badge
  -- - allow authenticated users to receive it for themselves (used by hunt upsert)
  -- - allow admins/service_role to assign initial holder on activation
  -- - if they already have it, don't raise (so ON CONFLICT can DO UPDATE)
  -- - avoid incrementing claims_count for existing owners
  IF is_hunt_target THEN
    -- Defense in depth: authenticated users can only receive it for themselves,
    -- except admins/service_role (needed for random initial assignment on activation)
    IF auth.uid() IS NOT NULL
       AND NEW.user_id <> auth.uid()
       AND NOT COALESCE(is_admin, false)
       AND jwt_role NOT IN ('service_role', 'supabase_admin') THEN
      RAISE EXCEPTION 'Cannot claim badge for another user';
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM public.user_badges ub
      WHERE ub.user_id = NEW.user_id
        AND ub.badge_id = NEW.badge_id
    ) INTO already_has;

    -- Already owned: allow upsert/update path (do not count as a new claim)
    IF already_has THEN
      RETURN NEW;
    END IF;

    -- New owner during hunt: allow without admin requirement.
    -- (We intentionally skip limited-claim enforcement here to avoid hunts being blocked.)
    UPDATE public.global_badges
    SET claims_count = COALESCE(claims_count, 0) + 1
    WHERE id = NEW.badge_id;

    RETURN NEW;
  END IF;

  -- Block self-assignment for all badges EXCEPT EARLY
  IF NOT is_early
     AND jwt_role NOT IN ('service_role', 'supabase_admin')
     AND auth.uid() IS NOT NULL
     AND NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Only administrators can assign badges';
  END IF;

  -- Prevent claiming for another user (defense in depth)
  IF is_early AND auth.uid() IS NOT NULL AND NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Cannot claim badge for another user';
  END IF;

  -- Prevent duplicate claims
  IF EXISTS (
    SELECT 1
    FROM public.user_badges ub
    WHERE ub.user_id = NEW.user_id
      AND ub.badge_id = NEW.badge_id
  ) THEN
    RAISE EXCEPTION 'Badge already claimed';
  END IF;

  -- EARLY deadline (only enforce for normal users; admins/service_role can still assign if needed)
  IF is_early
     AND jwt_role NOT IN ('service_role', 'supabase_admin')
     AND NOT COALESCE(is_admin, false)
     AND now() >= early_deadline THEN
    RAISE EXCEPTION 'EARLY badge claiming period has ended';
  END IF;

  -- Claim limit enforcement:
  -- - EARLY: strict (no bypass)
  -- - Other limited badges: admins/service_role can bypass
  IF badge_record.is_limited AND badge_record.max_claims IS NOT NULL THEN
    IF COALESCE(badge_record.claims_count, 0) >= badge_record.max_claims THEN
      IF is_early THEN
        RAISE EXCEPTION 'Badge claim limit reached';
      END IF;

      -- Only block non-admin/non-service_role for non-EARLY badges
      IF jwt_role NOT IN ('service_role', 'supabase_admin') AND NOT COALESCE(is_admin, false) THEN
        RAISE EXCEPTION 'Badge claim limit reached';
      END IF;
    END IF;
  END IF;

  -- Increment claims count atomically
  UPDATE public.global_badges
  SET claims_count = COALESCE(claims_count, 0) + 1
  WHERE id = NEW.badge_id;

  RETURN NEW;
END;
$function$;

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

      RAISE NOTICE 'Hunt badge enabled for random existing owner: %', v_random_user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS assign_hunt_badge_trigger ON public.badge_events;
CREATE TRIGGER assign_hunt_badge_trigger
BEFORE INSERT OR UPDATE ON public.badge_events
FOR EACH ROW
EXECUTE FUNCTION assign_hunt_badge_on_activation();