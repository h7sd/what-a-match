/*
  # Fix Discord CDN URLs by removing expiration parameters
  
  1. Changes
    - Remove temporary URL parameters (?ex=, &is=, &hm=) from Discord CDN URLs
    - This makes the URLs permanent and the images will load again
    
  2. Affected Badges
    - Halko
    - NELSON
    - OWNER
    - ROMBO
    - Venix
*/

-- Remove expiration parameters from Discord CDN URLs
UPDATE global_badges
SET icon_url = REGEXP_REPLACE(icon_url, '\?ex=[^&]*(&is=[^&]*)?(&hm=[^&]*)?(&)?', '', 'g')
WHERE icon_url LIKE '%discord%'
AND icon_url LIKE '%?ex=%';
