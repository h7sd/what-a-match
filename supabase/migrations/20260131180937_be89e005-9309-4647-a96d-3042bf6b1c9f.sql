-- Create function to increment link click count
CREATE OR REPLACE FUNCTION public.increment_link_click_count(p_link_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.social_links
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = p_link_id;
END;
$$;