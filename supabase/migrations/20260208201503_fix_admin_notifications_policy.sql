/*
  # Fix admin_notifications RLS policy

  The existing ALL policy only has USING clause but no WITH CHECK clause.
  For INSERT operations, we need WITH CHECK clause as well.
  
  This migration drops and recreates the policy with both clauses.
*/

-- Drop existing admin ALL policy
DROP POLICY IF EXISTS "admin_notifications_admin_all" ON public.admin_notifications;

-- Create separate policies for each operation for clarity
CREATE POLICY "Admins can insert notifications"
  ON public.admin_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read all notifications"
  ON public.admin_notifications
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update notifications"
  ON public.admin_notifications
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete notifications"
  ON public.admin_notifications
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));