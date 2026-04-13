/*
  # Fix Profile Likes/Dislikes System
  
  1. Problem
    - The trigger function `update_like_counts` and trigger `profile_likes_count_trigger` are missing
    - This prevents likes/dislikes counts from being updated in the profiles table
    - Users can vote but the counts never change
  
  2. Solution
    - Recreate the trigger function that updates like/dislike counts
    - Recreate the trigger to call this function on INSERT, UPDATE, DELETE
    - Recalculate all existing counts to fix any discrepancies
  
  3. Changes
    - Create `update_like_counts()` function to handle count updates
    - Create trigger on `profile_likes` table
    - Recalculate all profile counts from actual votes
*/

-- Create the trigger function to update like/dislike counts
CREATE OR REPLACE FUNCTION public.update_like_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Adding a new vote
    IF NEW.is_like THEN
      UPDATE public.profiles 
      SET likes_count = likes_count + 1, updated_at = now() 
      WHERE id = NEW.profile_id;
    ELSE
      UPDATE public.profiles 
      SET dislikes_count = dislikes_count + 1, updated_at = now() 
      WHERE id = NEW.profile_id;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Changing a vote (like -> dislike or vice versa)
    IF OLD.is_like != NEW.is_like THEN
      IF NEW.is_like THEN
        -- Changed from dislike to like
        UPDATE public.profiles 
        SET 
          likes_count = likes_count + 1, 
          dislikes_count = GREATEST(0, dislikes_count - 1), 
          updated_at = now() 
        WHERE id = NEW.profile_id;
      ELSE
        -- Changed from like to dislike
        UPDATE public.profiles 
        SET 
          likes_count = GREATEST(0, likes_count - 1), 
          dislikes_count = dislikes_count + 1, 
          updated_at = now() 
        WHERE id = NEW.profile_id;
      END IF;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Removing a vote
    IF OLD.is_like THEN
      UPDATE public.profiles 
      SET likes_count = GREATEST(0, likes_count - 1), updated_at = now() 
      WHERE id = OLD.profile_id;
    ELSE
      UPDATE public.profiles 
      SET dislikes_count = GREATEST(0, dislikes_count - 1), updated_at = now() 
      WHERE id = OLD.profile_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS profile_likes_count_trigger ON public.profile_likes;

-- Create the trigger
CREATE TRIGGER profile_likes_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profile_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_like_counts();

-- Recalculate all existing counts to fix any discrepancies
UPDATE public.profiles p
SET 
  likes_count = COALESCE((
    SELECT COUNT(*)
    FROM public.profile_likes pl
    WHERE pl.profile_id = p.id AND pl.is_like = true
  ), 0),
  dislikes_count = COALESCE((
    SELECT COUNT(*)
    FROM public.profile_likes pl
    WHERE pl.profile_id = p.id AND pl.is_like = false
  ), 0);
