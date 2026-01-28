-- Add start screen text animation column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS start_screen_animation text DEFAULT 'none';