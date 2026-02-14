/*
  # Fix service status function

  1. Changes
    - Fix ambiguous column reference in get_current_service_status function
    - Explicitly qualify all column names to avoid ambiguity
*/

-- Drop and recreate the function with proper column qualifications
DROP FUNCTION IF EXISTS get_current_service_status();

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
    s.id,
    s.name,
    s.slug,
    s.description,
    s.icon,
    COALESCE(latest.status, 'checking'),
    latest.response_time_ms,
    latest.checked_at,
    EXISTS(
      SELECT 1 FROM service_incidents i 
      WHERE i.service_id = s.id 
      AND i.resolved_at IS NULL
    )
  FROM services s
  LEFT JOIN LATERAL (
    SELECT 
      ssc.status, 
      ssc.response_time_ms, 
      ssc.checked_at
    FROM service_status_checks ssc
    WHERE ssc.service_id = s.id
    ORDER BY ssc.checked_at DESC
    LIMIT 1
  ) latest ON true
  WHERE s.is_active = true
  ORDER BY s.display_order, s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
