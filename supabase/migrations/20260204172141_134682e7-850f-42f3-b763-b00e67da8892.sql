-- UV Currency System

-- User UV balance table
CREATE TABLE public.user_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 1000,
  total_earned INTEGER NOT NULL DEFAULT 1000,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- UV Transactions log
CREATE TABLE public.uv_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earn', 'spend', 'refund', 'initial'
  description TEXT,
  reference_id UUID, -- can reference marketplace_items, etc.
  reference_type TEXT, -- 'marketplace_purchase', 'minigame', 'daily_reward', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Marketplace Items (badges and templates)
CREATE TABLE public.marketplace_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  item_type TEXT NOT NULL, -- 'badge', 'template'
  sale_type TEXT NOT NULL DEFAULT 'unlimited', -- 'single', 'limited', 'unlimited'
  
  -- Badge data (for item_type = 'badge')
  badge_name TEXT,
  badge_description TEXT,
  badge_icon_url TEXT,
  badge_color TEXT,
  
  -- Template data (for item_type = 'template')
  template_name TEXT,
  template_description TEXT,
  template_preview_url TEXT,
  template_data JSONB, -- stores all profile customization settings
  
  price INTEGER NOT NULL CHECK (price >= 1 AND price <= 10000),
  stock_limit INTEGER, -- for 'limited' type
  stock_sold INTEGER NOT NULL DEFAULT 0,
  
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'sold_out', 'removed'
  denial_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Marketplace purchases
CREATE TABLE public.marketplace_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.marketplace_items(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily rewards tracking
CREATE TABLE public.daily_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  discord_user_id TEXT NOT NULL,
  streak INTEGER NOT NULL DEFAULT 1,
  last_claim TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Minigame stats
CREATE TABLE public.minigame_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_user_id TEXT NOT NULL,
  user_id UUID,
  game_type TEXT NOT NULL, -- 'trivia', 'coinflip', 'numguess', 'slots', 'rps', 'blackjack'
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_lost INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(discord_user_id, game_type)
);

-- Enable RLS
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uv_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minigame_stats ENABLE ROW LEVEL SECURITY;

-- User balances policies
CREATE POLICY "Users can view own balance" ON public.user_balances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert balances" ON public.user_balances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update balances" ON public.user_balances
  FOR UPDATE USING (auth.uid() = user_id);

-- Transactions policies (users can view own)
CREATE POLICY "Users can view own transactions" ON public.uv_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Marketplace items policies
CREATE POLICY "Anyone can view approved items" ON public.marketplace_items
  FOR SELECT USING (status = 'approved' OR seller_id = auth.uid());

CREATE POLICY "Users can create items" ON public.marketplace_items
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own pending items" ON public.marketplace_items
  FOR UPDATE USING (auth.uid() = seller_id AND status = 'pending');

CREATE POLICY "Admins can manage all items" ON public.marketplace_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Purchases policies
CREATE POLICY "Users can view own purchases" ON public.marketplace_purchases
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create purchases" ON public.marketplace_purchases
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Daily rewards - public read for discord bot
CREATE POLICY "Anyone can view daily rewards" ON public.daily_rewards
  FOR SELECT USING (true);

CREATE POLICY "System can manage daily rewards" ON public.daily_rewards
  FOR ALL USING (true);

-- Minigame stats - public for leaderboards
CREATE POLICY "Anyone can view minigame stats" ON public.minigame_stats
  FOR SELECT USING (true);

CREATE POLICY "System can manage minigame stats" ON public.minigame_stats
  FOR ALL USING (true);

-- Function to initialize user balance on signup
CREATE OR REPLACE FUNCTION public.initialize_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_balances (user_id, balance, total_earned)
  VALUES (NEW.user_id, 1000, 1000)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Log the initial bonus
  INSERT INTO public.uv_transactions (user_id, amount, transaction_type, description)
  VALUES (NEW.user_id, 1000, 'initial', 'Welcome bonus - 1000 UV');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to give new users 1000 UV
CREATE TRIGGER on_profile_created_give_uv
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_balance();

-- Function to get user balance (public RPC for profiles)
CREATE OR REPLACE FUNCTION public.get_user_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT balance INTO v_balance FROM public.user_balances WHERE user_id = p_user_id;
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process marketplace purchase
CREATE OR REPLACE FUNCTION public.purchase_marketplace_item(p_item_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_buyer_balance INTEGER;
  v_buyer_id UUID;
BEGIN
  v_buyer_id := auth.uid();
  
  IF v_buyer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Lock and get item
  SELECT * INTO v_item FROM public.marketplace_items WHERE id = p_item_id FOR UPDATE;
  
  IF v_item IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found');
  END IF;
  
  IF v_item.status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item is not available');
  END IF;
  
  IF v_item.seller_id = v_buyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot buy your own item');
  END IF;
  
  -- Check stock for limited items
  IF v_item.sale_type = 'limited' AND v_item.stock_sold >= v_item.stock_limit THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item is sold out');
  END IF;
  
  -- Check if single item already sold
  IF v_item.sale_type = 'single' AND v_item.stock_sold > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item already sold');
  END IF;
  
  -- Check already purchased (for unlimited/limited)
  IF EXISTS (SELECT 1 FROM public.marketplace_purchases WHERE item_id = p_item_id AND buyer_id = v_buyer_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already own this item');
  END IF;
  
  -- Get buyer balance
  SELECT balance INTO v_buyer_balance FROM public.user_balances WHERE user_id = v_buyer_id FOR UPDATE;
  
  IF v_buyer_balance IS NULL OR v_buyer_balance < v_item.price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient UV balance');
  END IF;
  
  -- Deduct from buyer
  UPDATE public.user_balances 
  SET balance = balance - v_item.price, 
      total_spent = total_spent + v_item.price,
      updated_at = now()
  WHERE user_id = v_buyer_id;
  
  -- Add to seller
  UPDATE public.user_balances 
  SET balance = balance + v_item.price, 
      total_earned = total_earned + v_item.price,
      updated_at = now()
  WHERE user_id = v_item.seller_id;
  
  -- Create seller balance if not exists
  INSERT INTO public.user_balances (user_id, balance, total_earned)
  VALUES (v_item.seller_id, v_item.price, v_item.price)
  ON CONFLICT (user_id) DO UPDATE SET 
    balance = user_balances.balance + v_item.price,
    total_earned = user_balances.total_earned + v_item.price;
  
  -- Log transactions
  INSERT INTO public.uv_transactions (user_id, amount, transaction_type, description, reference_id, reference_type)
  VALUES 
    (v_buyer_id, -v_item.price, 'spend', 'Purchased: ' || COALESCE(v_item.badge_name, v_item.template_name), p_item_id, 'marketplace_purchase'),
    (v_item.seller_id, v_item.price, 'earn', 'Sold: ' || COALESCE(v_item.badge_name, v_item.template_name), p_item_id, 'marketplace_sale');
  
  -- Create purchase record
  INSERT INTO public.marketplace_purchases (buyer_id, item_id, seller_id, price)
  VALUES (v_buyer_id, p_item_id, v_item.seller_id, v_item.price);
  
  -- Update stock
  UPDATE public.marketplace_items 
  SET stock_sold = stock_sold + 1,
      status = CASE 
        WHEN sale_type = 'single' THEN 'sold_out'
        WHEN sale_type = 'limited' AND stock_sold + 1 >= stock_limit THEN 'sold_out'
        ELSE status
      END,
      updated_at = now()
  WHERE id = p_item_id;
  
  -- If badge type, create user_badge for buyer
  IF v_item.item_type = 'badge' THEN
    -- First create global badge if it doesn't exist
    INSERT INTO public.global_badges (name, description, icon_url, color, created_by, rarity)
    VALUES (v_item.badge_name, v_item.badge_description, v_item.badge_icon_url, v_item.badge_color, v_item.seller_id, 'marketplace')
    ON CONFLICT DO NOTHING;
    
    -- Then assign to buyer
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT v_buyer_id, id FROM public.global_badges 
    WHERE name = v_item.badge_name AND created_by = v_item.seller_id
    LIMIT 1
    ON CONFLICT DO NOTHING;
    
    -- For single sale, remove from seller
    IF v_item.sale_type = 'single' THEN
      DELETE FROM public.user_badges 
      WHERE user_id = v_item.seller_id 
      AND badge_id IN (
        SELECT id FROM public.global_badges 
        WHERE name = v_item.badge_name AND created_by = v_item.seller_id
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'Purchase successful!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX idx_marketplace_items_status ON public.marketplace_items(status);
CREATE INDEX idx_marketplace_items_seller ON public.marketplace_items(seller_id);
CREATE INDEX idx_marketplace_items_type ON public.marketplace_items(item_type);
CREATE INDEX idx_marketplace_purchases_buyer ON public.marketplace_purchases(buyer_id);
CREATE INDEX idx_uv_transactions_user ON public.uv_transactions(user_id);
CREATE INDEX idx_user_balances_user ON public.user_balances(user_id);
CREATE INDEX idx_minigame_stats_discord ON public.minigame_stats(discord_user_id);

-- Give existing users 1000 UV
INSERT INTO public.user_balances (user_id, balance, total_earned)
SELECT user_id, 1000, 1000 FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Log initial bonus for existing users
INSERT INTO public.uv_transactions (user_id, amount, transaction_type, description)
SELECT user_id, 1000, 'initial', 'Welcome bonus - 1000 UV' 
FROM public.profiles
WHERE user_id NOT IN (SELECT DISTINCT user_id FROM public.uv_transactions WHERE transaction_type = 'initial');