/*
  # Fix Global Badges Policy
  
  1. Problem
    - global_badges hat RLS enabled aber keine SELECT Policy
    - Globale Badge-Einstellungen können nicht gelesen werden
  
  2. Änderungen
    - Neue SELECT Policy: Jeder kann Global Badges sehen
    - Globale Badges sind öffentliche Informationen
  
  3. Sicherheit
    - SELECT ist safe - nur lesen
    - Änderungen bleiben geschützt (kein INSERT/UPDATE/DELETE für public)
*/

-- Jeder kann Global Badges sehen
CREATE POLICY "Anyone can view global badges"
ON global_badges
FOR SELECT
TO public
USING (true);
