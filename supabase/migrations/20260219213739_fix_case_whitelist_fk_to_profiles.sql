/*
  # Fix case_whitelist foreign key to reference profiles table
  
  The case_whitelist tables were created with FK to auth.users but some user IDs
  only exist in profiles. Drop and recreate with FK to profiles.
*/

DROP TABLE IF EXISTS case_whitelist_requests;
DROP TABLE IF EXISTS case_whitelist;

CREATE TABLE IF NOT EXISTS case_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT '',
  added_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE case_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own whitelist entry"
  ON case_whitelist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all whitelist entries"
  ON case_whitelist FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can insert whitelist entries"
  ON case_whitelist FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can delete whitelist entries"
  ON case_whitelist FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS case_whitelist_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  username text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE(user_id)
);

ALTER TABLE case_whitelist_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
  ON case_whitelist_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON case_whitelist_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can insert own request"
  ON case_whitelist_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending request"
  ON case_whitelist_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any request"
  ON case_whitelist_requests FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );
