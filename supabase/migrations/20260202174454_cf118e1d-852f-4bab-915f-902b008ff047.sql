-- First drop the existing function with the old return type
DROP FUNCTION IF EXISTS public.get_profile_badges(uuid);

-- Recreate with only public-facing fields (remove internal metadata like max_claims, claims_count, created_at)
CREATE OR REPLACE FUNCTION public.get_profile_badges(p_profile_id uuid)
RETURNS TABLE (
  id uuid, 
  name text, 
  description text, 
  icon_url text, 
  color text, 
  rarity text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    gb.id,
    gb.name,
    gb.description,
    gb.icon_url,
    gb.color,
    gb.rarity
  FROM user_badges ub
  INNER JOIN global_badges gb ON ub.badge_id = gb.id
  INNER JOIN profiles p ON p.user_id = ub.user_id
  WHERE p.id = p_profile_id
    AND ub.is_enabled = true
    AND (ub.is_locked IS NULL OR ub.is_locked = false);
$$;

-- Remove the overly permissive service role SELECT policy from banned_users
DROP POLICY IF EXISTS "Service role can read banned users" ON public.banned_users;

-- Create a SECURITY DEFINER function for ban status checks
-- This returns only minimal info (isBanned, canAppeal) - never full records
CREATE OR REPLACE FUNCTION public.check_user_ban_status(p_user_id uuid)
RETURNS TABLE (
  is_banned boolean,
  can_appeal boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ban_record RECORD;
BEGIN
  SELECT 
    appeal_deadline,
    appeal_submitted_at
  INTO ban_record
  FROM banned_users
  WHERE user_id = p_user_id
  LIMIT 1;
  
  IF ban_record IS NULL THEN
    RETURN QUERY SELECT false::boolean, false::boolean;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    true::boolean,
    (ban_record.appeal_deadline > now() AND ban_record.appeal_submitted_at IS NULL)::boolean;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_user_ban_status(uuid) TO anon, authenticated, service_role;