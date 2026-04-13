/*
  # Fix User Roles Infinite Recursion

  1. Problem
    - The user_roles_admin_all policy queries user_roles to check if someone is admin
    - This creates an infinite loop when accessing user_roles
    
  2. Solution
    - Remove the recursive admin policy
    - Keep the simple policies that don't cause recursion
    - Admins can still read their own roles via user_roles_own_read
*/

-- Drop the recursive admin policy
DROP POLICY IF EXISTS "user_roles_admin_all" ON user_roles;

-- The remaining policies are sufficient:
-- - user_roles_own_read: Users can read their own roles
-- - user_roles_public_read: Everyone can read all roles (for checking admin status)
