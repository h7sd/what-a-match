-- Add show_display_name column for visibility toggle
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_display_name boolean DEFAULT true;

-- Change start_screen_enabled default to false
ALTER TABLE public.profiles 
ALTER COLUMN start_screen_enabled SET DEFAULT false;

-- Update existing profiles that have start_screen_enabled = true (only if user hasn't explicitly set it)
-- We don't change existing values, just the default for new profiles