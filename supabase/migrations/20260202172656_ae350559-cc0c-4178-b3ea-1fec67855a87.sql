-- Create a secure function to get badges for a profile without exposing user_id
CREATE OR REPLACE FUNCTION public.get_profile_badges(p_profile_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  icon_url text,
  color text,
  rarity text,
  is_limited boolean,
  max_claims integer,
  claims_count integer,
  created_at timestamptz
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
    gb.rarity,
    gb.is_limited,
    gb.max_claims,
    gb.claims_count,
    gb.created_at
  FROM user_badges ub
  INNER JOIN global_badges gb ON ub.badge_id = gb.id
  INNER JOIN profiles p ON p.user_id = ub.user_id
  WHERE p.id = p_profile_id
    AND ub.is_enabled = true
    AND (ub.is_locked IS NULL OR ub.is_locked = false);
$$;