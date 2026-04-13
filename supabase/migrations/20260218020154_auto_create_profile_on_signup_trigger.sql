/*
  # Auto-create profile on user signup via trigger

  ## Problem
  After supabase.auth.signUp(), the user session is not yet active on the client,
  so auth.uid() returns null and the INSERT policy on profiles fails with an RLS error.

  ## Solution
  Create a trigger on auth.users that automatically inserts a profile row
  using SECURITY DEFINER (runs as superuser, bypasses RLS) whenever a new
  auth user is created.

  ## Changes
  - Create function handle_new_user() that inserts into profiles
  - Create trigger on_auth_user_created on auth.users
  - The trigger reads username from raw_user_meta_data if provided
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
BEGIN
  v_username := lower(trim(coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))));

  IF v_username = '' OR v_username IS NULL THEN
    v_username := 'user_' || substring(NEW.id::text, 1, 8);
  END IF;

  INSERT INTO public.profiles (user_id, username, display_name, created_at)
  VALUES (NEW.id, v_username, coalesce(NEW.raw_user_meta_data->>'username', v_username), now())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
