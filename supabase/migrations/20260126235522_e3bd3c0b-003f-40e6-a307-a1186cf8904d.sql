-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for admin management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create global_badges table for admin-created badges
CREATE TABLE public.global_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    color TEXT DEFAULT '#8B5CF6',
    rarity TEXT DEFAULT 'common',
    is_limited BOOLEAN DEFAULT false,
    max_claims INTEGER,
    claims_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on global_badges
ALTER TABLE public.global_badges ENABLE ROW LEVEL SECURITY;

-- Everyone can view global badges
CREATE POLICY "Global badges are viewable by everyone"
ON public.global_badges FOR SELECT
USING (true);

-- Only admins can manage global badges
CREATE POLICY "Admins can manage global badges"
ON public.global_badges FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create user_badges table to track which users have which badges
CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES public.global_badges(id) ON DELETE CASCADE NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, badge_id)
);

-- Enable RLS on user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Everyone can view user badges
CREATE POLICY "User badges are viewable by everyone"
ON public.user_badges FOR SELECT
USING (true);

-- Users can claim badges for themselves
CREATE POLICY "Users can claim badges"
ON public.user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all user badges
CREATE POLICY "Admins can manage user badges"
ON public.user_badges FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add your user as admin (replace with your user_id)
INSERT INTO public.user_roles (user_id, role)
SELECT '42fe6f70-12d4-406f-bf3d-72550f52420c', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = '42fe6f70-12d4-406f-bf3d-72550f52420c' AND role = 'admin'
);