/*
  # Fix Profile Comments & Likes Policies
  
  1. Problem
    - profile_comments und profile_likes haben "USING false" für alle Operations
    - Das blockiert ALLE Zugriffe, auch berechtigte
  
  2. Änderungen
    - Alte blockierende Policies löschen
    - Neue Policies erstellen die authentifizierten Usern erlauben:
      - Ihre eigenen Kommentare/Likes zu sehen
      - Neue Kommentare/Likes zu erstellen
      - Ihre eigenen Kommentare/Likes zu löschen
    - Profile-Besitzer können alle Kommentare auf ihrem Profil sehen/löschen
  
  3. Sicherheit
    - Nur authentifizierte User können kommentieren/liken
    - User können nur ihre eigenen Einträge bearbeiten
    - Profile-Besitzer haben Kontrolle über Kommentare auf ihrem Profil
*/

-- ============================================
-- PROFILE_COMMENTS POLICIES
-- ============================================

-- Alte blockierende Policy löschen
DROP POLICY IF EXISTS "No direct access to profile_comments" ON profile_comments;

-- Authentifizierte User können alle Kommentare sehen
CREATE POLICY "Users can view comments"
ON profile_comments
FOR SELECT
TO authenticated
USING (true);

-- Authentifizierte User können Kommentare erstellen
CREATE POLICY "Users can create comments"
ON profile_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = commenter_user_id);

-- Profile-Besitzer und Kommentar-Ersteller können Kommentare löschen
CREATE POLICY "Users can delete comments"
ON profile_comments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = profile_comments.profile_id
    AND profiles.user_id = auth.uid()
  )
  OR auth.uid() = commenter_user_id
);

-- ============================================
-- PROFILE_LIKES POLICIES
-- ============================================

-- Alte blockierende Policies löschen
DROP POLICY IF EXISTS "No direct access to profile_likes" ON profile_likes;
DROP POLICY IF EXISTS "No direct insert to profile_likes" ON profile_likes;
DROP POLICY IF EXISTS "No direct update to profile_likes" ON profile_likes;
DROP POLICY IF EXISTS "No direct delete to profile_likes" ON profile_likes;

-- Jeder kann Likes sehen (für Like-Zähler)
CREATE POLICY "Anyone can view likes"
ON profile_likes
FOR SELECT
TO public
USING (true);

-- Authentifizierte User können Likes erstellen
CREATE POLICY "Users can create likes"
ON profile_likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = liker_user_id);

-- User können ihre eigenen Likes updaten (toggle)
CREATE POLICY "Users can update their own likes"
ON profile_likes
FOR UPDATE
TO authenticated
USING (auth.uid() = liker_user_id)
WITH CHECK (auth.uid() = liker_user_id);

-- User können ihre eigenen Likes löschen
CREATE POLICY "Users can delete their own likes"
ON profile_likes
FOR DELETE
TO authenticated
USING (auth.uid() = liker_user_id);
