-- Add column to control visibility of volume control on profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_volume_control boolean DEFAULT true;