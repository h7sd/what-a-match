/*
  # Create check_username_available function

  ## Problem
  The signUp flow calls rpc('check_username_available') but the function
  does not exist in the database, causing "Error checking username availability".

  ## Changes
  - Create check_username_available(p_username text) -> boolean
    Returns true if the username is available (not taken), false if taken
  - Grants execute to anon and authenticated roles so the client can call it
*/

CREATE OR REPLACE FUNCTION check_username_available(p_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE lower(username) = lower(p_username)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_username_available(text) TO anon, authenticated;
