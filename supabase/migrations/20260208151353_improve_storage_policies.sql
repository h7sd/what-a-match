/*
  # Verbesserte Storage Policies
  
  1. Änderungen
    - Policies werden neu erstellt mit bucket_id Einschränkung
    - Upload/Update/Delete nur für authenticated users
    - Public read bleibt für öffentliche Buckets
  
  2. Sicherheit
    - Benutzer können nur ihre eigenen Dateien verwalten (Ordnerstruktur: {user_id}/filename)
    - Nur authentifizierte User können hochladen
*/

-- Alte Policies löschen
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Public Read für alle Buckets (da alle Buckets public sind)
CREATE POLICY "Public read access" 
ON storage.objects 
FOR SELECT 
TO public
USING (
  bucket_id IN ('avatars', 'backgrounds', 'badge-icons', 'audio', 'profile-assets')
);

-- Authenticated users können in ihren eigenen Ordner hochladen
CREATE POLICY "Users can upload own files" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id IN ('avatars', 'backgrounds', 'badge-icons', 'audio', 'profile-assets')
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Authenticated users können ihre eigenen Dateien aktualisieren
CREATE POLICY "Users can update own files" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id IN ('avatars', 'backgrounds', 'badge-icons', 'audio', 'profile-assets')
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Authenticated users können ihre eigenen Dateien löschen
CREATE POLICY "Users can delete own files" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id IN ('avatars', 'backgrounds', 'badge-icons', 'audio', 'profile-assets')
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
