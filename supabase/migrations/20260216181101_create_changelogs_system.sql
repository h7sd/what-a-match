/*
  # Create Changelog System

  1. New Tables
    - `changelogs`
      - `id` (uuid, primary key)
      - `version` (text) - Version number like "v1.2.3"
      - `title` (text) - Title of the changelog entry
      - `description` (text) - Detailed description of changes
      - `category` (text) - Category: feature, bugfix, improvement, security
      - `is_major` (boolean) - Whether this is a major update
      - `published_at` (timestamptz) - When the changelog was published
      - `created_by` (uuid) - Admin who created the changelog
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `changelogs` table
    - Public can read published changelogs
    - Only admins can create/update/delete changelogs

  3. Indexes
    - Index on `published_at` for efficient querying
    - Index on `category` for filtering
*/

CREATE TABLE IF NOT EXISTS changelogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'feature',
  is_major boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE changelogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published changelogs"
  ON changelogs FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert changelogs"
  ON changelogs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update changelogs"
  ON changelogs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete changelogs"
  ON changelogs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_changelogs_published_at ON changelogs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_changelogs_category ON changelogs(category);

CREATE OR REPLACE FUNCTION update_changelogs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_changelogs_updated_at_trigger ON changelogs;
CREATE TRIGGER update_changelogs_updated_at_trigger
  BEFORE UPDATE ON changelogs
  FOR EACH ROW
  EXECUTE FUNCTION update_changelogs_updated_at();