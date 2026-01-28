-- Create verification_codes table for email verification
CREATE TABLE public.verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('signup', 'email_change', 'password_reset')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_verification_codes_email_type ON public.verification_codes(email, type);
CREATE INDEX idx_verification_codes_expires_at ON public.verification_codes(expires_at);

-- Enable RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow inserts from edge functions (service role)
CREATE POLICY "Allow insert for service role" 
ON public.verification_codes 
FOR INSERT 
WITH CHECK (true);

-- Allow select for verification
CREATE POLICY "Allow select for verification" 
ON public.verification_codes 
FOR SELECT 
USING (true);

-- Allow update for marking as used
CREATE POLICY "Allow update for marking used" 
ON public.verification_codes 
FOR UPDATE 
USING (true);

-- Add email_verified column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Create function to clean up expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.verification_codes 
  WHERE expires_at < now() OR used_at IS NOT NULL;
END;
$$;