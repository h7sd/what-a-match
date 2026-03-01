/*
  # Recreate all hunt event functions and triggers

  1. New Functions
    - `get_hunt_badge_holder(p_event_id)` - Returns current holder of the hunt badge
    - `assign_hunt_badge_on_activation()` - Trigger function that assigns badge to random user on event activation
    - `steal_badge(p_victim_username, p_badge_name, p_event_id)` - Main game action for stealing/hunting badges
    - `return_badges_on_event_deactivation()` - Returns all stolen badges when event ends
    - `prevent_hunt_badge_hide()` - Prevents hunt badge holder from hiding badges

  2. New Triggers
    - `assign_hunt_badge_trigger` on badge_events (BEFORE INSERT OR UPDATE)
    - `return_badges_on_deactivation` on badge_events (AFTER UPDATE)
    - `prevent_hunt_badge_hide_trigger` on profiles (BEFORE UPDATE)

  3. Notes
    - These functions were previously defined in migrations but are missing from the database
    - Recreating them to restore full hunt/steal event functionality
*/

-- ============================================================
-- 1) get_hunt_badge_holder: returns current holder of hunt badge
-- ============================================================
CREATE OR REPLACE FUNCTION get_hunt_badge_holder(p_event_id uuid)
RETURNS TABLE(user_id uuid, username text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_badge_id uuid;
  v_thief_id uuid;
  v_holder_id uuid;
  v_username text;
BEGIN
  SELECT target_badge_id INTO v_badge_id
  FROM badge_events
  WHERE id = p_event_id AND is_active = true;

  IF v_badge_id IS NULL THEN
    RETURN;
  END IF;

  SELECT bs.thief_user_id INTO v_thief_id
  FROM badge_steals bs
  WHERE bs.event_id = p_event_id
    AND bs.badge_id = v_badge_id
    AND bs.returned = false
  ORDER BY bs.stolen_at DESC
  LIMIT 1;

  IF v_thief_id IS NOT NULL THEN
    SELECT p.username INTO v_username
    FROM profiles p WHERE p.id = v_thief_id;
    RETURN QUERY SELECT v_thief_id, v_username;
    RETURN;
  END IF;

  SELECT ub.user_id INTO v_holder_id
  FROM user_badges ub
  WHERE ub.badge_id = v_badge_id
    AND ub.is_enabled = true
    AND (ub.is_locked IS NULL OR ub.is_locked = false)
  LIMIT 1;

  IF v_holder_id IS NOT NULL THEN
    SELECT p.username INTO v_username
    FROM profiles p WHERE p.id = v_holder_id;
    RETURN QUERY SELECT v_holder_id, v_username;
    RETURN;
  END IF;

  RETURN;
END;
$$;

-- ============================================================
-- 2) assign_hunt_badge_on_activation: assigns badge to random user
-- ============================================================
CREATE OR REPLACE FUNCTION assign_hunt_badge_on_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_random_user_id uuid;
  v_badge_id uuid;
  v_owner_count int;
  v_has_enabled_holder boolean;
BEGIN
  IF NEW.event_type != 'hunt' OR NEW.target_badge_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_badge_id := NEW.target_badge_id;

  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    -- proceed
  ELSIF TG_OP = 'UPDATE' AND NEW.is_active = true AND (OLD.is_active IS NULL OR OLD.is_active = false) THEN
    -- proceed
  ELSIF TG_OP = 'UPDATE' AND NEW.is_active = true THEN
    SELECT EXISTS(
      SELECT 1 FROM user_badges
      WHERE badge_id = v_badge_id
        AND is_enabled = true
        AND (is_locked IS NULL OR is_locked = false)
    ) INTO v_has_enabled_holder;
    IF v_has_enabled_holder THEN
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  UPDATE user_badges
  SET is_enabled = false
  WHERE badge_id = v_badge_id;

  SELECT count(*) INTO v_owner_count
  FROM user_badges
  WHERE badge_id = v_badge_id
    AND (is_locked IS NULL OR is_locked = false);

  IF v_owner_count = 0 THEN
    SELECT id INTO v_random_user_id
    FROM profiles
    WHERE username IS NOT NULL AND username != ''
    ORDER BY random()
    LIMIT 1;

    IF v_random_user_id IS NOT NULL THEN
      INSERT INTO user_badges (user_id, badge_id, is_enabled, claimed_at)
      VALUES (v_random_user_id, v_badge_id, true, now())
      ON CONFLICT (user_id, badge_id) DO UPDATE
      SET is_enabled = true;

      UPDATE profiles SET show_badges = true WHERE id = v_random_user_id;
    END IF;
  ELSE
    SELECT user_id INTO v_random_user_id
    FROM user_badges
    WHERE badge_id = v_badge_id
      AND (is_locked IS NULL OR is_locked = false)
    ORDER BY random()
    LIMIT 1;

    IF v_random_user_id IS NOT NULL THEN
      UPDATE user_badges
      SET is_enabled = true
      WHERE user_id = v_random_user_id AND badge_id = v_badge_id;

      UPDATE profiles SET show_badges = true WHERE id = v_random_user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS assign_hunt_badge_trigger ON badge_events;
CREATE TRIGGER assign_hunt_badge_trigger
  BEFORE INSERT OR UPDATE ON badge_events
  FOR EACH ROW
  EXECUTE FUNCTION assign_hunt_badge_on_activation();

-- ============================================================
-- 3) steal_badge: main game action
-- ============================================================
CREATE OR REPLACE FUNCTION steal_badge(
  p_victim_username text,
  p_badge_name text,
  p_event_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_thief_id uuid;
  v_victim_id uuid;
  v_badge_id uuid;
  v_event badge_events%ROWTYPE;
  v_current_holder_id uuid;
  v_duration_hours int;
  v_returns_at timestamptz;
BEGIN
  v_thief_id := auth.uid();
  IF v_thief_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT id INTO v_victim_id
  FROM profiles WHERE username = p_victim_username;
  IF v_victim_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_thief_id = v_victim_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot steal from yourself');
  END IF;

  SELECT * INTO v_event
  FROM badge_events WHERE id = p_event_id AND is_active = true;
  IF v_event IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found or inactive');
  END IF;

  v_duration_hours := COALESCE(v_event.steal_duration_hours, 168);

  IF v_event.event_type = 'hunt' THEN
    v_badge_id := v_event.target_badge_id;
    IF v_badge_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'No target badge configured');
    END IF;

    SELECT bs.thief_user_id INTO v_current_holder_id
    FROM badge_steals bs
    WHERE bs.event_id = p_event_id
      AND bs.badge_id = v_badge_id
      AND bs.returned = false
    ORDER BY bs.stolen_at DESC
    LIMIT 1;

    IF v_current_holder_id IS NULL THEN
      SELECT ub.user_id INTO v_current_holder_id
      FROM user_badges ub
      WHERE ub.badge_id = v_badge_id
        AND ub.is_enabled = true
        AND (ub.is_locked IS NULL OR ub.is_locked = false)
      LIMIT 1;
    END IF;

    IF v_current_holder_id IS NULL OR v_current_holder_id != v_victim_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'This user is not the current badge holder');
    END IF;

    UPDATE badge_steals
    SET returned = true, returned_at = now()
    WHERE event_id = p_event_id
      AND badge_id = v_badge_id
      AND returned = false;

    v_returns_at := now() + interval '100 years';

    INSERT INTO badge_steals (thief_user_id, victim_user_id, badge_id, event_id, stolen_at, returns_at, returned)
    VALUES (v_thief_id, v_victim_id, v_badge_id, p_event_id, now(), v_returns_at, false);

    UPDATE user_badges SET is_enabled = false
    WHERE user_id = v_victim_id AND badge_id = v_badge_id;

    INSERT INTO user_badges (user_id, badge_id, is_enabled, claimed_at)
    VALUES (v_thief_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE
    SET is_enabled = true;

    UPDATE profiles SET show_badges = true WHERE id = v_thief_id;

    RETURN jsonb_build_object('success', true, 'message', 'Badge hunted successfully!');

  ELSE
    -- Steal mode
    IF EXISTS(
      SELECT 1 FROM badge_steals
      WHERE event_id = p_event_id
        AND thief_user_id = v_thief_id
        AND returned = false
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'You already stole a badge in this event');
    END IF;

    SELECT ub.badge_id INTO v_badge_id
    FROM user_badges ub
    JOIN global_badges gb ON gb.id = ub.badge_id
    WHERE ub.user_id = v_victim_id
      AND gb.name = p_badge_name
      AND ub.is_enabled = true
      AND (ub.is_locked IS NULL OR ub.is_locked = false)
    LIMIT 1;

    IF v_badge_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Badge not found on this user');
    END IF;

    v_returns_at := now() + (v_duration_hours || ' hours')::interval;

    INSERT INTO badge_steals (thief_user_id, victim_user_id, badge_id, event_id, stolen_at, returns_at, returned)
    VALUES (v_thief_id, v_victim_id, v_badge_id, p_event_id, now(), v_returns_at, false);

    UPDATE user_badges SET is_enabled = false
    WHERE user_id = v_victim_id AND badge_id = v_badge_id;

    INSERT INTO user_badges (user_id, badge_id, is_enabled, claimed_at)
    VALUES (v_thief_id, v_badge_id, true, now())
    ON CONFLICT (user_id, badge_id) DO UPDATE
    SET is_enabled = true;

    RETURN jsonb_build_object('success', true, 'message', 'Badge stolen successfully!');
  END IF;
END;
$$;

-- ============================================================
-- 4) return_badges_on_event_deactivation
-- ============================================================
CREATE OR REPLACE FUNCTION return_badges_on_event_deactivation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.is_active = true AND NEW.is_active = false THEN
    UPDATE badge_steals
    SET returned = true, returned_at = now()
    WHERE event_id = NEW.id AND returned = false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS return_badges_on_deactivation ON badge_events;
CREATE TRIGGER return_badges_on_deactivation
  AFTER UPDATE ON badge_events
  FOR EACH ROW
  EXECUTE FUNCTION return_badges_on_event_deactivation();

-- ============================================================
-- 5) prevent_hunt_badge_hide
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_hunt_badge_hide()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_holder boolean;
BEGIN
  IF OLD.show_badges = true AND NEW.show_badges = false THEN
    SELECT EXISTS(
      SELECT 1
      FROM badge_events be
      JOIN user_badges ub ON ub.badge_id = be.target_badge_id
      WHERE be.is_active = true
        AND be.event_type = 'hunt'
        AND ub.user_id = NEW.id
        AND ub.is_enabled = true
    ) INTO v_is_holder;

    IF v_is_holder THEN
      NEW.show_badges := true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_hunt_badge_hide_trigger ON profiles;
CREATE TRIGGER prevent_hunt_badge_hide_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_hunt_badge_hide();
