/*
  # Create Badge Helper RPC Functions

  1. New Functions
    - `get_public_badges` - Returns public badge list without created_by
    - `get_profile_badges` - Returns enabled badges for a profile
    - `has_role` - Checks if user has specific role (if not exists)

  2. Security
    - SECURITY DEFINER for safe data access
    - Returns only necessary information
*/

-- Create function to get public badges (without created_by for privacy)
CREATE OR REPLACE FUNCTION get_public_badges()
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
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    description,
    icon_url,
    color,
    rarity,
    is_limited,
    max_claims::integer,
    claims_count::integer,
    created_at
  FROM global_badges
  ORDER BY created_at DESC;
$$;

-- Create function to get profile badges (only enabled ones)
CREATE OR REPLACE FUNCTION get_profile_badges(p_profile_id uuid)
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
SECURITY DEFINER
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
    gb.max_claims::integer,
    gb.claims_count::integer,
    gb.created_at
  FROM global_badges gb
  INNER JOIN user_badges ub ON ub.badge_id = gb.id
  INNER JOIN profiles p ON p.user_id = ub.user_id
  WHERE p.id = p_profile_id
    AND ub.is_enabled = true
  ORDER BY ub.display_order ASC NULLS LAST, ub.claimed_at DESC;
$$;

-- Create has_role function if it doesn't exist
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;
