/*
  # Create stub functions for deprecated RPC calls

  Creates placeholder functions for old RPC endpoints that are no longer used
  but may still be called by cached browser code:
  - record_scripts_hit
  - claim_daily_reward

  These functions return empty results to prevent 404 errors.
*/

-- Stub function for record_scripts_hit (deprecated)
CREATE OR REPLACE FUNCTION public.record_scripts_hit(p_profile_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function is deprecated and does nothing
  -- Kept for backwards compatibility with cached code
  RETURN;
END;
$$;

-- Stub function for claim_daily_reward (deprecated)
CREATE OR REPLACE FUNCTION public.claim_daily_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function is deprecated
  -- Kept for backwards compatibility with cached code
  RETURN jsonb_build_object(
    'success', false,
    'message', 'This feature has been moved to a different endpoint'
  );
END;
$$;