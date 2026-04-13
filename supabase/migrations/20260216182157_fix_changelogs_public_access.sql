/*
  # Fix Changelogs Public Access

  1. Changes
    - Drop and recreate the SELECT policy for changelogs
    - Explicitly allow both anonymous and authenticated users to read changelogs
    - Ensure ANON_KEY can access the data without 401 errors

  2. Security
    - Public read access is intentional for changelogs
    - Write/update/delete still restricted to admins only
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Anyone can view published changelogs" ON changelogs;

-- Create new policy that explicitly allows anon and authenticated users
CREATE POLICY "Public can read changelogs"
  ON changelogs FOR SELECT
  TO anon, authenticated
  USING (true);
