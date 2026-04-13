/*
  # Fix Profiles RLS - Dashboard Loading Issue

  1. Problem
    - Dashboard loads profiles by user_id but policies only check id
    - This causes SELECT queries to fail for authenticated users
    
  2. Solution
    - Update policies to check both id AND user_id
    - This allows users to query their own profile
*/

-- Drop and recreate profiles policies with correct column checks
DROP POLICY IF EXISTS "profiles_owner_insert" ON profiles;
CREATE POLICY "profiles_owner_insert"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id OR (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "profiles_owner_update" ON profiles;
CREATE POLICY "profiles_owner_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id OR (select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = id OR (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "profiles_owner_delete" ON profiles;
CREATE POLICY "profiles_owner_delete"
  ON profiles FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = id OR (select auth.uid()) = user_id);
