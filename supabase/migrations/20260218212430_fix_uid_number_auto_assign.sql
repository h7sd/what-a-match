/*
  # Fix uid_number Auto-Assignment on Registration

  ## Problem
  New users registering are not getting a uid_number assigned.
  The handle_new_user() trigger inserts a profile row but uid_number
  relies on the SERIAL sequence which may not be functioning correctly,
  or profiles created via other paths skip the sequence.

  ## Solution
  1. Create a dedicated sequence for uid_number if not already backed by one
  2. Update handle_new_user() to explicitly set uid_number using nextval
  3. Backfill any existing profiles that have NULL or 0 uid_number

  ## Changes
  - Add/ensure uid_number_seq sequence exists
  - Update handle_new_user trigger function to assign uid_number
  - Backfill missing uid_numbers for existing profiles
*/

-- Create a dedicated sequence for uid_number if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'uid_number_seq') THEN
    CREATE SEQUENCE public.uid_number_seq START 1;
  END IF;
END $$;

-- Set the sequence to start after the current max uid_number
DO $$
DECLARE
  v_max int;
BEGIN
  SELECT COALESCE(MAX(uid_number), 0) INTO v_max FROM public.profiles WHERE uid_number > 0;
  IF v_max > 0 THEN
    PERFORM setval('public.uid_number_seq', v_max, true);
  END IF;
END $$;

-- Backfill profiles that have NULL or 0 uid_number, ordered by created_at
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM public.profiles
    WHERE uid_number IS NULL OR uid_number = 0
    ORDER BY created_at ASC
  LOOP
    UPDATE public.profiles
    SET uid_number = nextval('public.uid_number_seq')
    WHERE id = r.id;
  END LOOP;
END $$;

-- Update the handle_new_user trigger to explicitly assign uid_number from the sequence
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
  v_uid int;
BEGIN
  v_username := lower(trim(coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))));

  IF v_username = '' OR v_username IS NULL THEN
    v_username := 'user_' || substring(NEW.id::text, 1, 8);
  END IF;

  v_uid := nextval('public.uid_number_seq');

  INSERT INTO public.profiles (user_id, username, display_name, uid_number, created_at)
  VALUES (NEW.id, v_username, coalesce(NEW.raw_user_meta_data->>'username', v_username), v_uid, now())
  ON CONFLICT (user_id) DO UPDATE
    SET uid_number = CASE WHEN public.profiles.uid_number IS NULL OR public.profiles.uid_number = 0
                          THEN EXCLUDED.uid_number
                          ELSE public.profiles.uid_number
                     END;

  RETURN NEW;
END;
$$;

-- Recreate the trigger to ensure it's using the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
