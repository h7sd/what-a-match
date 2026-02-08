/*
  # Fix admin_give_coins function to use correct column names

  1. Changes
    - Update admin_give_coins to use `lifetime_earned` and `lifetime_spent` instead of `total_earned` and `total_spent`
    - These are the actual column names in the user_balances table
  
  2. Notes
    - This fixes the "could not find function" error
    - Maintains all security checks and validations
*/

CREATE OR REPLACE FUNCTION public.admin_give_coins(
  p_user_id UUID,
  p_amount_text TEXT,
  p_reason TEXT DEFAULT 'Admin bonus'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_amount numeric;
  v_new_balance numeric;
  v_username TEXT;
BEGIN
  v_admin_id := auth.uid();

  -- Check if caller is admin
  IF NOT public.has_role(v_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Parse amount
  BEGIN
    v_amount := trim(p_amount_text)::numeric;
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END;

  -- Enforce integer currency
  IF v_amount <> trunc(v_amount) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be a whole number');
  END IF;

  -- Validate amount
  IF v_amount = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount cannot be zero');
  END IF;

  -- Get username for logging
  SELECT username INTO v_username FROM public.profiles WHERE user_id = p_user_id;
  IF v_username IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Upsert user balance (using correct column names: lifetime_earned, lifetime_spent)
  INSERT INTO public.user_balances (user_id, balance, lifetime_earned, lifetime_spent)
  VALUES (
    p_user_id,
    GREATEST(v_amount, 0),
    CASE WHEN v_amount > 0 THEN v_amount ELSE 0 END,
    CASE WHEN v_amount < 0 THEN ABS(v_amount) ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance = GREATEST(user_balances.balance + v_amount, 0),
    lifetime_earned = CASE
      WHEN v_amount > 0 THEN user_balances.lifetime_earned + v_amount
      ELSE user_balances.lifetime_earned
    END,
    lifetime_spent = CASE
      WHEN v_amount < 0 THEN user_balances.lifetime_spent + ABS(v_amount)
      ELSE user_balances.lifetime_spent
    END,
    updated_at = now();

  -- Get new balance
  SELECT balance INTO v_new_balance FROM public.user_balances WHERE user_id = p_user_id;

  -- Log the transaction
  INSERT INTO public.uv_transactions (user_id, amount, transaction_type, description)
  VALUES (
    p_user_id,
    v_amount,
    CASE WHEN v_amount > 0 THEN 'earn' ELSE 'spend' END,
    COALESCE(p_reason, 'Admin bonus')
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Coins updated successfully',
    'new_balance', v_new_balance::text,
    'amount', v_amount::text
  );
END;
$$;