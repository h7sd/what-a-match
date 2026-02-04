-- Fix security warnings: Set search_path for functions and tighten RLS policies

-- Fix function search paths
ALTER FUNCTION public.initialize_user_balance() SET search_path = public;
ALTER FUNCTION public.get_user_balance(UUID) SET search_path = public;
ALTER FUNCTION public.purchase_marketplace_item(UUID) SET search_path = public;

-- Replace overly permissive RLS policies for daily_rewards
DROP POLICY IF EXISTS "System can manage daily rewards" ON public.daily_rewards;

-- Only service role (edge functions) can insert/update/delete
CREATE POLICY "Service role can manage daily rewards" ON public.daily_rewards
  FOR ALL USING (auth.role() = 'service_role');

-- Replace overly permissive RLS policies for minigame_stats
DROP POLICY IF EXISTS "System can manage minigame stats" ON public.minigame_stats;

-- Only service role (edge functions) can insert/update/delete
CREATE POLICY "Service role can manage minigame stats" ON public.minigame_stats
  FOR ALL USING (auth.role() = 'service_role');