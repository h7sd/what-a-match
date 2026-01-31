-- Add click tracking to social_links
ALTER TABLE public.social_links 
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Create link_clicks table for detailed tracking
CREATE TABLE IF NOT EXISTS public.link_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.social_links(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  viewer_ip_hash TEXT,
  viewer_country TEXT
);

-- Enable RLS on link_clicks
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert link clicks (public tracking)
CREATE POLICY "Anyone can record link clicks"
ON public.link_clicks FOR INSERT
WITH CHECK (true);

-- Profile owners can view their link click analytics
CREATE POLICY "Profile owners can view their link clicks"
ON public.link_clicks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.social_links sl
    WHERE sl.id = link_id AND is_profile_owner(sl.profile_id)
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_link_clicks_link_id ON public.link_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_social_links_click_count ON public.social_links(click_count DESC);