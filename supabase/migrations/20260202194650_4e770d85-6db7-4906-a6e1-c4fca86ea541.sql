-- Drop and recreate cleanup function with correct return type
DROP FUNCTION IF EXISTS public.cleanup_expired_verification_codes();

-- Add CHECK constraints for verification codes
ALTER TABLE public.verification_codes
ADD CONSTRAINT verification_codes_code_format CHECK (code ~ '^[0-9]{6}$'),
ADD CONSTRAINT verification_codes_type_valid CHECK (type IN ('signup', 'password_reset', 'email_change', 'delete_account', 'mfa_setup')),
ADD CONSTRAINT verification_codes_expiry_max CHECK (expires_at <= created_at + interval '15 minutes');

-- Create index for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON public.verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_type ON public.verification_codes(email, type);

-- Enhanced validation trigger with rate limiting
CREATE OR REPLACE FUNCTION public.validate_verification_code_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_codes_count integer;
  max_codes_per_hour constant integer := 5;
BEGIN
  -- Validate code format (6 digits)
  IF NEW.code !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'Invalid verification code format';
  END IF;
  
  -- Ensure expiration is not too far in the future (max 15 minutes)
  IF NEW.expires_at > NEW.created_at + interval '15 minutes' THEN
    NEW.expires_at := NEW.created_at + interval '15 minutes';
  END IF;
  
  -- Rate limit: max 5 codes per email per hour
  SELECT COUNT(*) INTO recent_codes_count
  FROM public.verification_codes
  WHERE email = NEW.email
    AND created_at > now() - interval '1 hour';
  
  IF recent_codes_count >= max_codes_per_hour THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many verification codes requested';
  END IF;
  
  -- Invalidate any existing unused codes for same email and type
  UPDATE public.verification_codes
  SET used_at = now()
  WHERE email = NEW.email
    AND type = NEW.type
    AND used_at IS NULL;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS validate_verification_code_before_insert ON public.verification_codes;
CREATE TRIGGER validate_verification_code_before_insert
  BEFORE INSERT ON public.verification_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_verification_code_insert();

-- Enhanced cleanup function
CREATE FUNCTION public.cleanup_expired_verification_codes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.verification_codes 
  WHERE expires_at < now() 
     OR used_at IS NOT NULL
     OR created_at < now() - interval '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Scheduled cleanup function
CREATE OR REPLACE FUNCTION public.scheduled_security_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.cleanup_expired_verification_codes();
END;
$$;