-- Add Discord presence card customization fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS discord_card_style text DEFAULT 'glass',
ADD COLUMN IF NOT EXISTS discord_card_opacity integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS discord_show_badge boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS discord_badge_color text DEFAULT '#ec4899';