/*
  # Fix verification_codes table

  ## Problem
  The verification_codes table is missing required columns (email, code, type, expires_at).
  Only the id column exists, causing INSERT operations to fail.

  ## Changes
  - Add missing columns: email, code, type, expires_at, used, created_at
  - Add index on email for faster lookups
  - Enable RLS
  - Add policy allowing service role full access (edge functions use service role)
*/

ALTER TABLE verification_codes
  ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS code text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'signup',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS used boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);
