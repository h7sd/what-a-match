/*
  # Enable Realtime for admin_notifications

  Enables realtime subscriptions for the admin_notifications table
  so that live notifications can be pushed to all connected clients.
*/

-- Enable realtime for admin_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;