/*
  # Fix Missing Profile Data Policies
  
  1. Problem
    - badges, user_badges, social_links, profile_views haben RLS enabled
    - Aber KEINE SELECT Policies → komplett blockiert
    - Profile können nicht angezeigt werden ohne diese Daten
  
  2. Änderungen - Neue SELECT Policies für:
    - badges: Jeder kann alle Badges sehen (sind öffentlich)
    - user_badges: Jeder kann User-Badges sehen (für Profile)
    - social_links: Jeder kann Social Links sehen (für Profile)
    - profile_views: Jeder kann Views sehen (für Statistiken)
  
  3. Sicherheit
    - SELECT ist safe - nur lesen, nicht ändern
    - INSERT/UPDATE/DELETE bleiben geschützt
*/

-- ============================================
-- BADGES POLICIES
-- ============================================

-- Jeder kann alle verfügbaren Badges sehen
CREATE POLICY "Anyone can view badges"
ON badges
FOR SELECT
TO public
USING (true);

-- ============================================
-- USER_BADGES POLICIES
-- ============================================

-- Jeder kann User-Badges sehen (für Profile-Anzeige)
CREATE POLICY "Anyone can view user badges"
ON user_badges
FOR SELECT
TO public
USING (true);

-- ============================================
-- SOCIAL_LINKS POLICIES
-- ============================================

-- Jeder kann Social Links sehen (für Profile-Anzeige)
CREATE POLICY "Anyone can view social links"
ON social_links
FOR SELECT
TO public
USING (true);

-- ============================================
-- PROFILE_VIEWS POLICIES
-- ============================================

-- Jeder kann Profile Views sehen (für View-Counter)
CREATE POLICY "Anyone can view profile views"
ON profile_views
FOR SELECT
TO public
USING (true);
