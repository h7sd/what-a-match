-- Create promo_codes table for gift codes and discount codes
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'discount' CHECK (type IN ('gift', 'discount')),
  discount_percentage INTEGER NOT NULL DEFAULT 100 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  max_uses INTEGER DEFAULT NULL,
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can manage promo codes
CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Anyone can read active codes (needed for validation at checkout)
CREATE POLICY "Anyone can read active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true);

-- Create promo_code_uses table to track which users used which codes
CREATE TABLE public.promo_code_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(code_id, user_id)
);

-- Enable RLS
ALTER TABLE public.promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Admins can view all uses
CREATE POLICY "Admins can view all code uses"
ON public.promo_code_uses
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Service role can insert (via edge function)
CREATE POLICY "Service role can insert code uses"
ON public.promo_code_uses
FOR INSERT
WITH CHECK (true);