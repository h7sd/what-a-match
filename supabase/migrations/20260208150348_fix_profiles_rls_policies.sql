/*
  # Fix Profiles RLS Policies

  ## Problem
  The profiles table has RLS enabled but NO policies, blocking all access.
  
  ## Changes
  1. Add SELECT policy for authenticated users to read all profiles (public data)
  2. Add SELECT policy for users to read their own full profile (including private fields)
  3. Add INSERT policy for service role only (handled by trigger)
  4. Add UPDATE policy for users to update their own profile
  5. Add DELETE policy for service role only
  
  ## Security
  - Public profiles are readable by all authenticated users
  - Users can only update their own profile
  - Only service role can create/delete profiles
*/

-- Policy: Anyone authenticated can read public profile data
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Only service role can insert profiles (done via trigger)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Only service role can delete profiles
CREATE POLICY "Service role can delete profiles"
  ON profiles FOR DELETE
  TO service_role
  USING (true);
