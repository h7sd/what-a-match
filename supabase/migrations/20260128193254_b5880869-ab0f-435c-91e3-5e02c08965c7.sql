-- Secure uid_number from user manipulation
-- Create a function to prevent uid_number updates
CREATE OR REPLACE FUNCTION public.prevent_uid_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If uid_number is being changed and user is not an admin
  IF OLD.uid_number IS DISTINCT FROM NEW.uid_number THEN
    -- Only allow if user is an admin
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'uid_number cannot be modified';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to prevent uid_number changes
DROP TRIGGER IF EXISTS prevent_uid_change_trigger ON public.profiles;
CREATE TRIGGER prevent_uid_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_uid_change();