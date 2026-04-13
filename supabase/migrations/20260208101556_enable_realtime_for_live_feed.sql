/*
  # Enable Realtime for Live Feed

  1. Changes
    - Enables realtime replication for live_feed table
    - Allows frontend to receive live updates when cases are opened

  2. Security
    - Maintains existing RLS policies
    - Only enables publication, no security changes
*/

-- Enable realtime for live_feed table
ALTER PUBLICATION supabase_realtime ADD TABLE live_feed;
