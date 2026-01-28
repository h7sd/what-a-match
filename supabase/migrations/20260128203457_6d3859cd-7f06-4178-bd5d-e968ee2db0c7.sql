-- Fix verification_codes RLS - make it service role only for insert
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow insert for service role" ON public.verification_codes;
DROP POLICY IF EXISTS "Allow select for verification" ON public.verification_codes;
DROP POLICY IF EXISTS "Allow update for marking used" ON public.verification_codes;

-- Create restrictive policies - only service role can insert (via edge functions)
-- No direct public access allowed
CREATE POLICY "Service role only - insert" 
ON public.verification_codes 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role only - select" 
ON public.verification_codes 
FOR SELECT 
TO service_role
USING (true);

CREATE POLICY "Service role only - update" 
ON public.verification_codes 
FOR UPDATE 
TO service_role
USING (true);

CREATE POLICY "Service role only - delete" 
ON public.verification_codes 
FOR DELETE 
TO service_role
USING (true);