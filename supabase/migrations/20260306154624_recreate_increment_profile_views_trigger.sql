/*
  # Recreate profile views increment trigger

  1. Changes
    - Recreates the `increment_profile_views` function that was missing
    - Recreates the `increment_views_on_insert` trigger on `profile_views` table
    - When a new row is inserted into `profile_views`, the trigger increments
      `views_count` on the corresponding profile

  2. Important Notes
    - The function uses SECURITY DEFINER to ensure it can update profiles
    - This trigger is essential for keeping profile view counts accurate
*/

CREATE OR REPLACE FUNCTION public.increment_profile_views()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles 
    SET views_count = views_count + 1 
    WHERE id = NEW.profile_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'increment_views_on_insert' 
        AND tgrelid = 'public.profile_views'::regclass
    ) THEN
        CREATE TRIGGER increment_views_on_insert
        AFTER INSERT ON public.profile_views
        FOR EACH ROW EXECUTE FUNCTION public.increment_profile_views();
    END IF;
END $$;
