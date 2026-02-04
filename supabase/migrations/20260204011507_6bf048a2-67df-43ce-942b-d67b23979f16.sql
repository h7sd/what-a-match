-- Fix 1: Remove the problematic unique constraint that blocks re-hunting
ALTER TABLE public.badge_steals 
DROP CONSTRAINT IF EXISTS badge_steals_event_id_badge_id_thief_user_id_victim_user_id_key;

-- Fix 2: Add trigger to prevent disabling hunt target badge during active hunt
CREATE OR REPLACE FUNCTION public.prevent_hunt_badge_disable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If trying to disable a badge that is the target of an active hunt event
  IF OLD.is_enabled = true AND NEW.is_enabled = false THEN
    IF EXISTS (
      SELECT 1 FROM badge_events be
      WHERE be.is_active = true
        AND be.event_type = 'hunt'
        AND be.target_badge_id = NEW.badge_id
    ) THEN
      -- Only block if this is a user action (not the steal_badge function changing it)
      -- We check if the current user is the owner of this badge
      IF NEW.user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot disable this badge during an active hunt event';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Drop if exists and create trigger
DROP TRIGGER IF EXISTS prevent_hunt_badge_disable_trigger ON public.user_badges;
CREATE TRIGGER prevent_hunt_badge_disable_trigger
BEFORE UPDATE ON public.user_badges
FOR EACH ROW
EXECUTE FUNCTION prevent_hunt_badge_disable();