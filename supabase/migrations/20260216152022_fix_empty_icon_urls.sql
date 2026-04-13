/*
  # Fix empty icon URLs
  
  1. Changes
    - Convert empty strings to NULL in icon_url column
    - This allows proper fallback to icon rendering
    
  2. Security
    - No RLS changes needed (read-only update)
*/

-- Convert empty strings to NULL
UPDATE global_badges
SET icon_url = NULL
WHERE icon_url = '';
