/*
  # Create get_profile_badges_with_friends RPC function

  Creates a function that returns all badges for a profile:
  - User badges from user_badges table (global badges)
  - Friend badges from friend_badges table (custom badges)
  
  Returns a combined list of all enabled badges sorted by display order.
*/

CREATE OR REPLACE FUNCTION public.get_profile_badges_with_friends(p_profile_id uuid)
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
  created_at timestamptz,
  display_order integer,
  source text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Get user_id from profile_id
  WITH profile_info AS (
    SELECT user_id
    FROM profiles
    WHERE id = p_profile_id
    LIMIT 1
  ),
  -- Get global badges from user_badges
  global_badges AS (
    SELECT 
      gb.id,
      gb.name,
      gb.description,
      gb.icon_url,
      gb.color,
      gb.rarity,
      gb.is_limited,
      gb.max_claims::integer,
      gb.claims_count::integer,
      gb.created_at,
      ub.display_order,
      'global'::text as source
    FROM global_badges gb
    INNER JOIN user_badges ub ON ub.badge_id = gb.id
    INNER JOIN profile_info pi ON pi.user_id = ub.user_id
    WHERE ub.is_enabled = true
  ),
  -- Get friend badges
  friend_badges_list AS (
    SELECT 
      fb.id,
      fb.name,
      fb.description,
      fb.icon_url,
      fb.color,
      NULL::text as rarity,
      false as is_limited,
      0 as max_claims,
      0 as claims_count,
      fb.created_at,
      fb.display_order,
      'friend'::text as source
    FROM friend_badges fb
    INNER JOIN profile_info pi ON pi.user_id = fb.recipient_id
    WHERE fb.is_enabled = true
  )
  -- Combine both sources
  SELECT * FROM global_badges
  UNION ALL
  SELECT * FROM friend_badges_list
  ORDER BY display_order ASC NULLS LAST, created_at DESC;
$$;