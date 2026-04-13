/*
  # Service Status System

  1. New Tables
    - `services`
      - `id` (uuid, primary key)
      - `name` (text) - Service name (e.g., "Website", "Database")
      - `slug` (text, unique) - URL-friendly identifier
      - `description` (text) - Service description
      - `icon` (text) - Icon name for UI
      - `display_order` (integer) - Sort order
      - `is_active` (boolean) - Whether to show in status page
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `service_status_checks`
      - `id` (uuid, primary key)
      - `service_id` (uuid, foreign key to services)
      - `status` (text) - operational, degraded, outage
      - `response_time_ms` (integer) - Response time in milliseconds
      - `error_message` (text, nullable) - Error details if any
      - `checked_at` (timestamptz) - When the check was performed
      - `metadata` (jsonb, nullable) - Additional check data
    
    - `service_incidents`
      - `id` (uuid, primary key)
      - `service_id` (uuid, foreign key to services)
      - `title` (text) - Incident title
      - `description` (text) - Detailed description
      - `status` (text) - investigating, identified, monitoring, resolved
      - `severity` (text) - minor, major, critical
      - `started_at` (timestamptz)
      - `resolved_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Allow public read access for status page
    - Restrict write access to service role only

  3. Functions
    - `get_current_service_status()` - Returns latest status for all services
    - `get_service_uptime(service_id, period)` - Calculate uptime percentage
*/

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Server',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  USING (is_active = true);

-- Create service_status_checks table
CREATE TABLE IF NOT EXISTS service_status_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('operational', 'degraded', 'outage')),
  response_time_ms integer,
  error_message text,
  metadata jsonb,
  checked_at timestamptz DEFAULT now()
);

ALTER TABLE service_status_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view status checks"
  ON service_status_checks FOR SELECT
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_status_checks_service_time 
  ON service_status_checks(service_id, checked_at DESC);

-- Create service_incidents table
CREATE TABLE IF NOT EXISTS service_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  severity text NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
  started_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view incidents"
  ON service_incidents FOR SELECT
  USING (true);

-- Create index for active incidents
CREATE INDEX IF NOT EXISTS idx_incidents_active 
  ON service_incidents(service_id, started_at DESC) 
  WHERE resolved_at IS NULL;

-- Function to get current service status
CREATE OR REPLACE FUNCTION get_current_service_status()
RETURNS TABLE (
  service_id uuid,
  service_name text,
  service_slug text,
  service_description text,
  service_icon text,
  current_status text,
  response_time_ms integer,
  last_checked timestamptz,
  has_active_incident boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as service_id,
    s.name as service_name,
    s.slug as service_slug,
    s.description as service_description,
    s.icon as service_icon,
    COALESCE(latest.status, 'checking') as current_status,
    latest.response_time_ms,
    latest.checked_at as last_checked,
    EXISTS(
      SELECT 1 FROM service_incidents i 
      WHERE i.service_id = s.id 
      AND i.resolved_at IS NULL
    ) as has_active_incident
  FROM services s
  LEFT JOIN LATERAL (
    SELECT status, response_time_ms, checked_at
    FROM service_status_checks
    WHERE service_id = s.id
    ORDER BY checked_at DESC
    LIMIT 1
  ) latest ON true
  WHERE s.is_active = true
  ORDER BY s.display_order, s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate service uptime
CREATE OR REPLACE FUNCTION get_service_uptime(
  p_service_id uuid,
  p_hours integer DEFAULT 24
)
RETURNS numeric AS $$
DECLARE
  v_total_checks integer;
  v_operational_checks integer;
  v_uptime numeric;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'operational')
  INTO v_total_checks, v_operational_checks
  FROM service_status_checks
  WHERE service_id = p_service_id
  AND checked_at >= now() - (p_hours || ' hours')::interval;
  
  IF v_total_checks = 0 THEN
    RETURN 100.0;
  END IF;
  
  v_uptime := (v_operational_checks::numeric / v_total_checks::numeric) * 100;
  RETURN ROUND(v_uptime, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default services
INSERT INTO services (name, slug, description, icon, display_order) VALUES
  ('Website', 'website', 'Main application frontend', 'Globe', 1),
  ('Cloudflare', 'cloudflare', 'CDN & DDoS Protection', 'Cloud', 2),
  ('Database', 'database', 'Data storage & retrieval', 'Database', 3),
  ('Authentication', 'auth', 'User login & security', 'Shield', 4),
  ('Login & Register', 'login-register', 'User sign-in & registration', 'Shield', 5),
  ('Discord Bot', 'discord-bot', 'Discord integration & presence', 'MessageCircle', 6),
  ('Edge Functions', 'edge-functions', 'Backend serverless functions', 'Server', 7)
ON CONFLICT (slug) DO NOTHING;
