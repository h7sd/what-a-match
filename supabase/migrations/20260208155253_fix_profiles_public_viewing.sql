/*
  # Fix Profiles Public Viewing
  
  1. Problem
    - profiles SELECT Policy gilt nur für "authenticated" User
    - Landing Page und öffentliche Profile sind nicht mehr sichtbar
    - Nicht-eingeloggte User können keine Profile anschauen
  
  2. Änderungen
    - Alte authenticated-only SELECT Policy löschen
    - Neue Policy: Jeder (auch nicht eingeloggt) kann Profile sehen
    - Profile sind öffentlich und sollen teilbar sein
  
  3. Sicherheit
    - SELECT ist safe - User können Profile nur lesen, nicht ändern
    - UPDATE Policy bleibt - nur Owner können ihr Profil bearbeiten
*/

-- Alte authenticated-only Policy löschen
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON profiles;

-- Neue Policy: Jeder kann Profile sehen
CREATE POLICY "Anyone can view profiles"
ON profiles
FOR SELECT
TO public
USING (true);
