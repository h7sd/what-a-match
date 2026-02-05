-- Update validate_badge_claim function to allow marketplace purchases
CREATE OR REPLACE FUNCTION public.validate_badge_claim()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  badge_record RECORD;
  is_admin BOOLEAN;
  jwt_role text;
  jwt_claims json;
  is_early boolean;
  is_hunt_target boolean;
  already_has boolean;
  early_deadline timestamptz := '2026-02-27T00:00:00Z';
  bypass_context text;
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

  -- Special internal context used by steal_badge() to perform temporary transfers.
  bypass_context := current_setting('app.badge_claim_context', true);
  
  -- Allow bypass for steal_badge context
  IF bypass_context = 'steal_badge' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.badge_events be
      WHERE be.is_active = true
        AND be.event_type = 'steal'
    ) THEN
      RAISE EXCEPTION 'No active steal event';
    END IF;

    IF auth.uid() IS NULL OR NEW.user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Cannot claim badge for another user';
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM public.user_badges ub
      WHERE ub.user_id = NEW.user_id
        AND ub.badge_id = NEW.badge_id
    ) INTO already_has;

    RETURN NEW;
  END IF;

  -- Allow bypass for marketplace_purchase context (internal SECURITY DEFINER function)
  IF bypass_context = 'marketplace_purchase' THEN
    -- Marketplace purchases are validated by the purchase_marketplace_item function
    -- which already checks: item is approved, user has balance, user didn't already buy, etc.
    
    SELECT EXISTS (
      SELECT 1
      FROM public.user_badges ub
      WHERE ub.user_id = NEW.user_id
        AND ub.badge_id = NEW.badge_id
    ) INTO already_has;

    -- Already owned: allow upsert path
    IF already_has THEN
      RETURN NEW;
    END IF;

    -- New owner via marketplace: increment claims count
    UPDATE public.global_badges
    SET claims_count = COALESCE(claims_count, 0) + 1
    WHERE id = NEW.badge_id;

    RETURN NEW;
  END IF;

  -- Is this badge currently the target of an active hunt event?
  SELECT EXISTS (
    SELECT 1
    FROM public.badge_events be
    WHERE be.is_active = true
      AND be.event_type = 'hunt'
      AND be.target_badge_id = NEW.badge_id
  ) INTO is_hunt_target;

  -- Special-case: active HUNT target badge
  IF is_hunt_target THEN
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

    IF already_has THEN
      RETURN NEW;
    END IF;

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

  -- EARLY badge specific logic
  IF is_early THEN
    IF now() > early_deadline THEN
      RAISE EXCEPTION 'The EARLY badge claiming period has ended';
    END IF;

    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    IF NEW.user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Cannot claim badge for another user';
    END IF;
  END IF;

  -- Check for limited badges
  IF badge_record.is_limited = true AND badge_record.max_claims IS NOT NULL THEN
    IF COALESCE(badge_record.claims_count, 0) >= badge_record.max_claims THEN
      RAISE EXCEPTION 'This badge has reached its maximum claims';
    END IF;
  END IF;

  -- Increment claims count
  UPDATE public.global_badges
  SET claims_count = COALESCE(claims_count, 0) + 1
  WHERE id = NEW.badge_id;

  RETURN NEW;
END;
$$;