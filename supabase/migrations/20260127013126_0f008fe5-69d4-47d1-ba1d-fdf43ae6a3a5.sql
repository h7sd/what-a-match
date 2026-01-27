-- Add uid_number column to track registration order
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS uid_number SERIAL;

-- Update existing profiles with their registration order based on created_at
WITH numbered_profiles AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.profiles
)
UPDATE public.profiles p
SET uid_number = np.rn
FROM numbered_profiles np
WHERE p.id = np.id;